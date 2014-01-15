// 
function getAllOWLObjects() {
    var objs = g().getAllOWLObjects();
    objs.addAll(ont().getAnnotationPropertiesInSignature());
    return objs.toArray();
}


// creates lookup index
// e.g. objmap.organ
function indexOnt() {
    objmap = {};
    var objs = getAllOWLObjects();
    //var objs = g().getAllOWLObjects().toArray();;
    for (var k in objs) {
        var obj = objs[k];
        var label = getClassVariableName(obj);
        if (label != null) {
            objmap[label] = obj;
        }
    }
}
