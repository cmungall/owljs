var assert = require("assert")
createOntology()
addMode(true)
owl.setReasonerType("hermit")

var adapt = function(opts) {

    var baseInd = opts.template;
    var queryProp = opts.follow_inverse;
    var prop;
    var newBase;
    if (opts.differentia != null) {
        prop = opts.differentia.property;
        newBase = opts.differentia.filler;
    }
    var mods = opts.mods;
    var template_relation = opts.template_relation != null ? opts.template_relation : o.adapted_from;

    var newBaseLabel = owl.getLabel(newBase);
    owl.getReasoner().flush();
    var inds = owl.getInferredInstances( hasValue(queryProp, baseInd), false);
    inds.push(baseInd);
    var clonemap = {};
    var baseClone;
    for (var k in inds) {
        var ind = inds[k];
        console.log(" CHILD: "+ind);
        if (opts.loses != null && opts.loses.indexOf(ind) > -1) {
            console.log("LOSS OF "+ind);
            continue;
        }
        var label = owl.getLabel(ind);
        var cloneLabel = label + ", " + newBaseLabel;
        if (opts.label != null) {
            cloneLabel = opts.label + " " + label;
            if (ind.equals(baseInd)) {
                cloneLabel = opts.label;
            }
        }
        var clone = mkIndividual(cloneLabel);
        console.log(ind+" "+label+" --> "+clone);
        clonemap[ind] = clone;

        // add relationship to root/newBase
        if (newBase != null && ind.equals(baseInd)) {
            baseClone = clone;
            add( propertyAssertion( prop, clone, newBase ));            
        }
    }
    // copy relationships as a materialization step;
    // can be viewed as default-inheritance
    for (var k in inds) {
        var ind = inds[k];
        var clone = clonemap[ind];
        if (clone == null) {
            //console.log("Cannot find clone for "+ind);
            // e.g. loss of entity
            continue;
        }
        add( propertyAssertion( template_relation, clone, ind ));
        var pvs = owl.getPropertyValues(ind);
        for (var j in pvs) {
            var pv = pvs[j];
            var v = pv.value;
            // restrict copied edges to the cloned set
            if (clonemap[v] != null) {
                console.log("   PV:"+pv.property+" "+v);
                add( propertyAssertion( pv.property, clone, clonemap[v] ));
            }
        }
    }
    if (mods != null) {
        // TODO
    }
    return baseClone;
};
///load("tests/repl/adapt.js")

// UPPER ONTOLOGY: RELATIONS
mkObjectProperty("develops from", { transitive: true })
mkObjectProperty("part of", { transitive: true })
subPropertyChainOf([o.part_of, o.develops_from], o.develops_from);
mkObjectProperty("develops from part of", { transitive: true })
subPropertyChainOf([o.develops_from, o.part_of], o.develops_from_part_of);

mkObjectProperty("specialization of", { transitive: true })
mkObjectProperty("adapted from", { transitive: true })
mkObjectProperty("adapted from part of", { transitive: true })
subPropertyChainOf([o.adapted_from, o.part_of], o.adapted_from_part_of);
mkObjectProperty("part of adapted from", { transitive: true })
subPropertyChainOf([o.part_of, o.adapted_from], o.part_of_adapted_from);
mkObjectProperty("dct", { transitive: true })
mkObjectProperty("connected to");
mkObjectProperty("homologous to", {transitive: true});
subPropertyChainOf([o.adapted_from, inverseOf(o.adapted_from)], o.homologous_to);
mkObjectProperty("serially homologous to", {transitive: true});
subPropertyChainOf([o.specialization_of, inverseOf(o.specialization_of)], o.serially_homologous_to);

// UPPER ONTOLOGY: CLASSES
mkDisjointUnion(
    {
        "anatomical entity" : {
            "organism" : {},
            "appendage" : {},
            "segment" : {},
        }
    });
mkClass("acropod element");
subClassOf(o.acropod_element, o.segment); // ??

// TAXONOMY
addMembersInHierarchy(
    {
        "metazoan" : {
            "craniate" : {
                "vertebrate" : {
                    "gnathostome" : {
                        "teleostomi" : {
                            "sacropterygian" : {
                                "tetrapod" : {
                                    "amniote" : {
                                        "mammal" : {
                                            "therian" : {
                                                "euarchontoglires" : {
                                                    "human" : {},
                                                    "mouse" : {}
                                                },
                                                "whale" : {},
                                                "cow" : {},
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "chondricthyan" : {}
                    },
                    "lamprey" : {}
                }
            },
            "hagfish" : {}
        }
    },
    {
        class: o.organism,
        property: o.adapted_from,
        isInvert: true
    }
);

//addMembers(o.segment, ["fin"]);

// new classes
//addMembers(o.segment,
//           ["pelvic girdle",
//            "pectoral girdle"]);




addMembersInHierarchy(
 {
   "limb" : {
      "zeugopod" : {},
      "autopod" : {
         "acropod" : [
            "digit1",
            "digit2",
            "digit3",
            "digit4",
            "digit5"
         ],
          "metapod" : {},
          "mesopod" : {}
      },
       "stylopod" : null
   },
     "fin": {},
     "girdle" : {},
     "appendage bud" : {},
 },
    {
        class: o.segment,
        property: o.part_of,
        isInvert: true
    });

propertyAssertion( o.develops_from, o.appendage_bud, o.fin );

adapt({
    label: "pelvic girdle",
    template: o.girdle, 
    template_relation: o.specialization_of,
    follow_inverse: o.part_of, 
});

adapt({
    label: "pectoral girdle",
    template: o.girdle, 
    template_relation: o.specialization_of,
    follow_inverse: o.part_of, 
});

// special rules for digits; ensure each is a type of generic dicit
var digits = [o.digit1, o.digit2, o.digit3, o.digit4, o.digit5];
addMembers(o.acropod_element, ["digit"]); // create a grouping class
digits.forEach(function(d){propertyAssertion(o.specialization_of, d, o.digit)});

/*
adapt({
    label: "limb",
    template: o.fin, 
    template_relation: o.adapted_from,
    follow_inverse: o.part_of,
    differentia : {
        property: o.part_of, 
        filler: o.tetrapod
    }
});
*/

adapt({
    label: "limb bud",
    template: o.appendage_bud, 
    template_relation: o.adapted_from,
    follow_inverse: o.part_of,
    differentia : {
        property: o.part_of, 
        filler: o.limb
    }
});

// connect to evolutionary history
propertyAssertion( o.adapted_from, o.limb, o.fin );

// connect to taxonomy
propertyAssertion( o.part_of, o.limb, o.tetrapod );

propertyAssertion( o.develops_from, o.limb, o.limb_bud ); // TODO - via adapts relation


var pelvic_fin =
    adapt({
        label: "pelvic fin",
        transition: "evolution of paired fins from fin fold??",
        template: o.fin, 
        template_relation: o.specialization_of,
        follow_inverse: o.part_of, 
        differentia: {
            property: o.connected_to, 
            filler: o.pelvic_girdle
        }
    });
var pectoral_fin =
    adapt({
        label: "pectoral fin",
        transition: "evolution of paired fins from fin fold??",
        template: o.fin, 
        template_relation: o.specialization_of,
        follow_inverse: o.part_of, 
        differentia: {
            property: o.connected_to, 
            filler: o.pectoral_girdle
        }
    });

var pectoral_limb = 
    adapt({
        label : "forelimb",
        template: o.limb, 
        template_relation: o.specialization_of,
        follow_inverse: o.part_of, 
        differentia: {
            property: o.adapted_from, 
            filler: o.pectoral_fin
        }
    });

var pelvic_limb = 
    adapt({
        label : "hindlimb",
        template: o.limb, 
        template_relation: o.specialization_of,
        follow_inverse: o.part_of, 
        differentia: {
            property: o.adapted_from, 
            filler: o.pelvic_fin
        }
    });

var mammal_limb =
    adapt({
        template: o.limb, 
        follow_inverse: o.part_of, 
        differentia: {
            property: o.part_of, 
            filler: o.mammal
        }
    });

[o.forelimb, o.hindlimb].forEach(function(x) {
    adapt({
        template: x, 
        follow_inverse: o.part_of, 
        differentia: {
            property: o.part_of, 
            filler: o.mammal
        }})
});
         


var human_limb = 
    adapt({
        template: mammal_limb, 
        template_relation: o.adapted_from,
        follow_inverse: o.part_of, 
        differentia: {
            property: o.part_of, 
            filler: o.human
        }
    });

var mouse_limb = 
    adapt({
        template: mammal_limb, 
        follow_inverse: o.part_of, 
        differentia: {
            property: o.part_of, 
            filler: o.mouse
        }
    });

var cow_limb = 
    adapt({
        template: mammal_limb, 
        follow_inverse: o.part_of, 
        differentia: {
            property: o.part_of, 
            filler: o.cow
        },
        loses: [
            o.digit1__mammal,
            o.digit2__mammal,
            o.digit4__mammal,
            o.digit5__mammal
        ],
        
    });


save("foo.owl")




