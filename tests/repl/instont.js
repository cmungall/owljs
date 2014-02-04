var assert = require("assert")
createOntology()
addMode(true)
mkObjectProperty("part of", { transitive: true })
mkClass("kinase")
mkClass("pathway")
mkClass("cascade")
addMembers(o.kinase, ["i1", "i2", "i3"])
addMembers(o.cascade, ["c1"])
addMembers(o.pathway, ["p1"])
propertyAssertion(o.part_of, o.i1, o.c1)
propertyAssertion(o.part_of, o.c1, o.p1)

x = someValuesFrom(o.part_of, o.pathway)
inds = owl.getInferredInstances(x, false);
print("#inds = "+inds.length);
inds.forEach(pp)
assert.equal(inds.length, 2)

x = hasValue(o.part_of, o.p1)
inds = owl.getInferredInstances(x, false);
print("#inds (hasValue) = "+inds.length);
inds.forEach(pp)
assert.equal(inds.length, 2)

save("foo.owl")




