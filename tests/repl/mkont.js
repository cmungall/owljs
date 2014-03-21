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

