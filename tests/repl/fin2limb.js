var assert = require("assert")
createOntology()
addMode(true)
owl.setReasonerType("hermit"); // TODO 

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
    // child instances are also cloned
    console.log("Q: "+ hasValue(queryProp, baseInd));
    var inds = owl.getInferredInstances( hasValue(queryProp, baseInd), false);
    console.log("CHILDREN OF: "+ baseInd+ " " + inds.length+" by inv: "+queryProp);
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
            cloneLabel = opts.label + " of " + label;
            if (ind.equals(baseInd)) {
                cloneLabel = opts.label;
            }
            if (opts.label_map != null) {
                if (opts.label_map[label] != null) {
                    cloneLabel = opts.label_map[label];
                    console.log("LMAP TO " + cloneLabel);
                }
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
mkObjectProperty("part of", { transitive: true })
mkObjectProperty("specialization of", { transitive: true, comment: "in-species variant of" })
mkObjectProperty("adapted from", { transitive: true })
mkObjectProperty("part of adapted from", { transitive: true })
subPropertyChainOf([o.part_of, o.adapted_from], o.part_of_adapted_from);
mkObjectProperty("specified by", { transitive: true });
subPropertyChainOf([o.specialization_of, o.specified_by], o.specified_by);

mkObjectProperty("part of specialization of", { transitive: true, comment: "may not work in hermit" })
subPropertyOf(o.specialization_of, o.part_of_specialization_of)
subPropertyChainOf([o.part_of, o.part_of_specialization_of], o.part_of_specialization_of);

mkObjectProperty("indirectly specified by", { transitive: true, comment: "..." })
subPropertyOf(o.specified_by, o.indirectly_specified_by)
subPropertyChainOf([o.part_of_specialization_of, o.indirectly_specified_by], o.indirectly_specified_by);


// UPPER ONTOLOGY: CLASSES
mkDisjointUnion(
    {
        "anatomical entity" : {
            "organism" : {},
            "appendage" : {},
            "segment" : {},
        },
        "pathway" : {},
        "gene" : {}
    });
mkClass("acropod element");
subClassOf(o.acropod_element, o.segment); // ??
addMembers(o.gene, ["g1", "g2"]);

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
                                        "chicken" : {},
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

addMembers(o.pathway, ["fin pathway"])
addMembers(o.appendage, ["fin"])
propertyAssertion(o.specified_by, o.fin, o.fin_pathway);

adapt({
    label: "pelvic fin",
    transition: "evolution of paired fins from fin fold??",
    template: o.fin, 
    template_relation: o.specialization_of,
    follow_inverse: o.part_of, 
    differentia: { 
        property: o.specified_by, 
        filler: o.g1
    }
});
adapt({
    label: "pectoral fin",
    transition: "evolution of paired fins from fin fold??",
    template: o.fin, 
    template_relation: o.specialization_of,
    follow_inverse: o.part_of, 
    differentia: { 
        property: o.specified_by, 
        filler: o.g2
    }
});

adapt({
    label: "proto-autopod",
    transition: "evolution of autopod in lungfish",
    template: o.fin, 
    template_relation: o.part_of,
    follow_inverse: o.specialization_of, 
    differentia: { 
        property: o.part_of, 
        filler: o.sacropterygian
    }
});


adapt({
    label: "limb pathway",
    transition: "fin to limb, genetic switch",
    template: o.fin_pathway, 
    template_relation: o.adapted_from,
    follow_inverse: o.indirectly_specified_by, 
    label_map : {
        "fin" : "limb",
        "pectoral fin" : "forelimb",
        "pevlic fin" : "hindlimb",
    },
    differentia: { 
        property: o.part_of, 
        filler: o.tetrapod
    }
});


adapt({
    label: "autopod",
    transition: "evolution of autopod in lungfish",
    template: o.proto_autopod, 
    template_relation: o.adapted_from,
    follow_inverse: o.specialization_of, 
    label_map : {
        "proto-autopod of pectoral fin" : "hand",
        "proto-autopod of pelvic fin" : "foot",
    },
    xmap : [
    ],
    differentia: { 
        property: o.part_of, 
        filler: o.limb
    }
});


adapt({
    label: "acropod",
    transition: "evolution of digits",
    template: o.autopod, 
    template_relation: o.part_of,
    follow_inverse: o.specialization_of, 
});

[1,2,3,4,5,6,7,8].forEach(
    function(num) {
        adapt({
            label: "digit "+num,
            transition: "evolution of digits",
            template: o.acropod, 
            template_relation: o.part_of,
            follow_inverse: o.specialization_of, 
            differentia: { 
                property: o.part_of, 
                filler: o.tetrapod
            }
        });
    });


adapt({
    label: "stylopod",
    transition: "evolution of stylopod",
    template: o.limb, 
    template_relation: o.part_of,
    follow_inverse: o.specialization_of, 
    differentia: { 
        property: o.part_of, 
        filler: o.tetrapod
    }
});
adapt({
    label: "zeugopod",
    transition: "evolution of stylopod",
    template: o.limb, 
    template_relation: o.part_of,
    follow_inverse: o.specialization_of, 
    differentia: { 
        property: o.part_of, 
        filler: o.tetrapod
    }
});

adapt({
    label: "pentadactyl limb",
    transition: "crown tetrapod limb",
    template: o.limb,  // TODO
    template_relation: o.adapted_from,
    follow_inverse: o.part_of_specialization_of, 
    differentia: { 
        property: o.part_of, 
        filler: o.tetrapod
    },
    loses: [
        o.digit_8 // TODO
    ]
});


save("foo.owl")




