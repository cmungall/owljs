A Read-Eval-Print-Loop (REPL) is a powerful way to interactively query
and modify ontologies. The owljs REPL allows full access to the owl.js
API, as well as access to JVM calls, including those to the OWLAPI.

## Getting started

To start a REPL session:

    owljs-repl [-i INCLUDE] [OWLFILE]

You can type any javascript commands, e.g.

    print(1+2)

The variable "owl" contains a pointer to an OWL object. E.g.

    neuron = owl.find("neuron")

Often it's not necessary to call methods on this object, as the repl
exports convenience functions directly.

The variable "o" contains an entry for every class in the ontology,
allowing easy access to OWLClasses without knowing their
IRIs. E.g. typing:

    print(o.neuron)

Shows the IRI for that class.

Axioms can be directly added as follows:

    add( subClassOf(o.neuron, someValuesFrom(o.part_of, o.nervous_system)) )

The "add" function is optional if you run in add-mode:

   addMode(true)
   subClassOf(o.neuron, someValuesFrom(o.part_of, o.nervous_system))

Note that autocomplete is enabled, so if you type:

    o.nerv[TAB]

You will see various choices.

The "q" variable is initiated with a dlmatch object. See dlmatch
documentation for details.

## Sample session

You can try this using the files distributed with owl.js

```
~/repos/owl.js $ owljs-repl test/data/ceph.owl 
REPL enabled, all systems go!
>> Welcome!
>> o.tent^[TAB]

tentacle             tentacle_absence     tentacle_pad         tentacle_pocket      tentacle_thickness   tentacular_club
>> o.tentacle
[uk.ac.manchester.cs.owl.owlapi.OWLClassImpl <http://purl.obolibrary.org/obo/CEPH_0000256>]
>> cx = o.some^[TAB]

someValuesFrom(
>> cx = someValuesFrom(o.pa^[TAB]

paralarval_stage                       part_of                                part_of_developmental_precursor_of     part_of_structure_that_is_capable_of   participates_in
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


