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
expandDisjointUnions()

// instances
addMembers(o.hepatocyte, ["hepatocyte1", "hepatocyte2"]);
for (var i=1; i<=10; i++) {
    classAssertion(o.neuron, mkIndividual("n"+i));
}

save("test/repl/foo.owl")

