A Read-Eval-Print-Loop (REPL) is a powerful way to interactively query
and modify ontologies. The owljs REPL allows full access to the owljs
API, as well as access to JVM calls, including those to the OWLAPI.

## Getting started

To start a REPL session:

    owljs [-i INCLUDE] [OWLFILE]

Where INCLUDE is any javascript file to be loaded, and OWLFILE is an
ontology loaded on startup.

These examples assume we are loading the cell ontology:

    owljs cl.owl

You can type any javascript commands, e.g.

    >> print(1+2)
    3

The global variable "owl" contains a pointer to an OWL object. E.g.

    >> neuron = owl.find("neuron")

Often it's not necessary to call methods on this object, as the repl
exports convenience functions directly.

## Accessing classes easily

The global variable "o" contains an entry for every class in the ontology,
allowing easy access to OWLClasses without knowing their
IRIs. E.g. typing:

    >> print(o.neuron)
    <http://purl.obolibrary.org/obo/CL_0000540>

Shows the IRI for that class.

You can also type

    >> o.neuron
    [uk.ac.manchester.cs.owl.owlapi.OWLClassImpl <http://purl.obolibrary.org/obo/CL_0000540>]

Axioms can be directly added as follows:

    >> add( subClassOf(o.neuron, someValuesFrom(o.part_of, o.nervous_system)) )

The "add" function is optional if you run in add-mode:

    >> addMode(true)
    >> subClassOf(o.neuron, someValuesFrom(o.part_of, o.nervous_system))

This will automatically add the axiom

## Command line autocomplete

Note that autocomplete is enabled, so if you type:

    >> o.nerv[HIT TAB KEY]

You will see various choices:

    nerve
    nerve_root                   
    nervous_system               
    nervous_system_development

## Queries and matching

The "q" variable is initiated with a dlmatch object. See dlmatch
documentation for details.

Create a match object - all existential parents of neuron:

    >> m = q.subClassOfMatch(o.neuron, q.someValuesFromMatch("?p", "?w"))

Find all axioms conforming to match:

    >> matches = q.find(m)

This yields an array of length 3.

Pretty-print each match:

    >> matches.forEach(function(m){pp(m.p),pp(m.w)})
    o.capable_of
    o.transmission_of_nerve_impulse
    o.part_of
    o.nervous_system
    o.develops_from
    o.neuroblast

Find-and-replace to change axioms for their reciprocals:

    >>  matches = q.findAndReplace(m, function(m,owl) { return subClassOf(o.neuron, someValuesFrom(inverseOf(m.p), m.w)) })



## Sample session

You can try this using the files distributed with owljs


```
~/repos/owljs $ owljs test/data/ceph.owl 
REPL enabled, all systems go!
>> Welcome!
>> o.tent^[TAB]

tentacle   tentacle_absence     tentacle_pad         tentacle_pocket      tentacle_thickness   tentacular_club
>> o.tentacle
[uk.ac.manchester.cs.owl.owlapi.OWLClassImpl <http://purl.obolibrary.org/obo/CEPH_0000256>]
>> cx = o.some^[TAB]

someValuesFrom(
>> cx = someValuesFrom(o.pa^[TAB]

paralarval_stage             part_of            part_of_developmental_precursor_of     part_of_structure_that_is_capable_of   participates_in
>> cx = someValuesFrom(o.part_of, o.tentacle)
[uk.ac.manchester.cs.owl.owlapi.OWLObjectSomeValuesFromImpl ObjectSomeValuesFrom(<http://purl.obolibrary.org/obo/BFO_0000050> <http://purl.obolibrary.org/obo/CEPH_0000256>)]
>> owl.getInferredSubClasses(cx).forEach(pp)
o.dactylus
o.tentacle_pad
o.carpal_sucker
o.carpal_knob
o.tentacle_absence
o.carpus
o.tentacle_pocket
o.carpal_locking_apparatus
o.stalk_of_tentacle
o.tentacular_club
o.keel
o.manus_of_tentacular_club
o.protective_membrane
```


## Ontology authoring in js

First ensure you have a default URI prefix set up. This is best done via a startup script, such as the one below

```
$ cat cl-my-conf.js 
// To use this conf:
//
// cd cell-ontology/src/ontology
// owljs-repl -i cl-my-conf.js cl-edit.owl
//
// Make sure file is copied to same dir, or add a symlink.
// You can clone this for your own setup

owl.config.idspace = 'CL';
owl.config.lastId = 10000; // MY
owl.defaultSlotMap = { created_by : "ORCID:1234" };
owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this

print("Welcome, ME");
```

Then, on the unix command line start the owljs session:

```
owljs-repl -i cl-my-conf.js cl-edit.owl
```

```
mkClass({label: "my cell", subClassOf: o.neuron, definition: "yadda"})
```

Inspired by tawny-owl, but less elegant, you can author ontologies as either js programs or directly on the command line

```
addMode(true)
createOntology("test")

// create upper ontology
mkDisjointUnion(
    {
        entity : 
        {
            "continuant" : 
            {
                "independent continaunt" : 
                    ["material entity", "immaterial entity"],
                "dependent continuant" :
                 {"quality" : [],
                  "realizable" : [
                         "role",
                         "function",
                         "disposition"
                  ]}
            },
            "occurrent" : 
            ["process", "history"]
        }
    })

// annotation vocabulary
mkAnnotationProperty("source")
srcAnn = ann(o.source, "my test")

// make an annotated axiom
mkClass("cell")
subClassOf(o.cell, o.material_entity, [srcAnn])

// cell types
// use a different style of DU
mkDisjointUnionSimple(
    o.cell,
    ["neuron", "hepatocyte", "muscle cell", "epithelial cell"]
)
// for reasoners like Elk, we want to supplement the DU
// axioms with weaker subclass and disjointFrom axioms
expandDisjointUnions()

// instances, example 1: add two hepatocyte instances:
addMembers(o.hepatocyte, ["hepatocyte1", "hepatocyte2"]);

// example 2: add 10 neuron instances
for (var i=1; i<=10; i++) {
    classAssertion(o.neuron, mkIndividual("n"+i));
}

// save the ontology
save("target/repl/foo.owl")
```


