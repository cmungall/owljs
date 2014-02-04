var obovocab = require("owl/vocab/obo");

var getOntologyStats = exports.getOntologyStats = function(owl, objs, gf) {
    return {
        avgAncestors : avgInferredSuperClassesPerClass(owl, objs, gf, false ),
        avgParents : avgInferredSuperClassesPerClass(owl, objs, gf, true ),
    }
}

var avgPerObj = function(owl, objs, nFunc, gf) {
    if (gf == null) {
        gf = function() { return obovocab.getOboIdentifierPrefix(owl, obj) };
    }
    if (objs == null) {
        objs = owl.getClasses().filter(function(c) { return !owl.isDeprecated(c)} );
    }
    var countsByGroup = {};
    for (var k in objs) {
        var obj = objs[k];
        var n = nFunc.call(this, obj);
        var g = gf.call(this, obj);
        if (g == null) {
            g = "null";
        }
        if (countsByGroup[g] == null) {
            countsByGroup[g] = [];
        }
        countsByGroup[g].push(n);
    }
    var am = {};
    for (var k in countsByGroup) {
        var tot = countsByGroup[k].reduce( function(a,b) { return a+b } );
        am[k] = tot / countsByGroup[k].length;
    }
    return am;
}

var avgInferredSuperClassesPerClass = exports.avgInferredSuperClassesPerClass = function(owl,objs,gf,isDirect) {
    if (isDirect == null) {
        isDirect = true;
    }
    return avgPerObj(owl,
                     objs,
                     function(c) {
                         return owl.getInferredSuperClasses(c, isDirect, false).length;
                     },
                     gf);
}
