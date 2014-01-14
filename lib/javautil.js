/* Namespace: javautil
 *
 * handy functions for interacting with java
 *
 */

export('collectionToJsArray',
       'javaArrayToJsArray',
       'jsArrayToSet');

function collectionToJsArray(col) {
    return javaArrayToJsArray(col.toArray());
}

function javaArrayToJsArray(a) {
    var l = [];
    for (var k=0; k<a.length; k++) {
        l.push(a[k]);
    }
    return l;
}

function jsArrayToSet(l) {
    var hs = new java.util.HashSet();
    for (var k in l) {
        // note: odd things happen with addAll(...)
        hs.add(l[k]);
    }
    return hs;
}
