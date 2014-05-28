/* Namespace: Linky
 *
 *
 *
 * Tests:
 *  - test/linky
 *
 */

export('Linky');

var javautil = require("owljs/javautil");
var md = require("owljs/io/markdown");

importPackage(Packages.org.semanticweb.owlapi.model);


/* Function: Linky
 *
 * Constructor
 *
 * Arguments:
 *  - owl: an <OWL> object
 */
function Linky(owl, io) {
    this.owl = owl;
    this.io = io;

    this.equivalenceAxioms = owl.getAllAxioms().filter(
        function(a) {
            return a instanceof OWLEquivalentClassesAxiom
        });

    return this;
}


Linky.prototype.getSource = function(obj) {
    var iri = obj.getIRI().toString() + "";
    var m = iri.match(/obolibrary.org\/obo\/(\S+)_/);
    if (m != null) {
        return m[1];
    }
    m = iri.match(/(\S+)#/);
    if (m != null) {
        return m[1];
    }
    m = iri.match(/(\w+)/);
    if (m != null) {
        return m[1];
    }
    return null;
}

Linky.prototype.decluster = function() {
    var owl = this.owl;
    var cs = owl.getClasses(true);
    var linky = this;

    var isDone = {};

    for (var ci in cs) {
        var c = cs[ci];
        var node = owl.getReasoner().getEquivalentClasses(c);
        var nodeClasses = javautil.collectionToJsArray(node.getEntities());
        var rc = node.getRepresentativeElement();
        if (isDone[rc]) {
            continue;
        }
        isDone[rc] = true;

        if (node.getSize() > 1) {

            this.log(node + " size = "+node.getSize());

            var clsBySrc = {};
            var hasMulti = {};
            nodeClasses.forEach(function(nc) {
                var src = linky.getSource(nc);
                if (clsBySrc[src] == null) {
                    clsBySrc[src] = [];
                }
                clsBySrc[src].push(c);
                if (clsBySrc[src].length > 1) {
                    hasMulti[src] = true;
                }
            });
            var ncmd = nodeClasses.map(function(nc){ return md.renderOWLObject(nc, owl) }).join(" + ");
            this.log("hasMulti: "+Object.keys(hasMulti));

            if (Object.keys(hasMulti).length == 0) {
                // all good
                this.log("All is good");
            }
            else if (Object.keys(hasMulti).length == 1) {
                this.report(" * one-to-many cluster: "+ ncmd);
                // we can rescue this cluster by making all members of
                // the multiset subclasses of the members of the other set(s)
                for (var ni in nodeClasses) {
                    var nc = nodeClasses[ni];
                    var src = this.getSource(nc);
                    if (hasMulti[src]) {
                        this.weakenEquivalenceAxioms(nc, true);
                    }
                }
            }
            else {
                this.report(" * many-to-many cluster: "+ncmd);
                // bijective cluster-f__k.

                for (var ni in nodeClasses) {
                    var nc = nodeClasses[ni];

                    this.weakenEquivalenceAxioms(nc, false);
                }

            }
        }

    }
}

Linky.prototype.weakenEquivalenceAxioms = function(c, isReplace) {
    var owl = this.owl;

    this.log("Weakening EC axioms for "+c);
    for (var ai in this.equivalenceAxioms) {
        var a = this.equivalenceAxioms[ai];
        if (a.contains(c)) {
            this.log("Removing: "+a+" R:"+isReplace);
            this.report("    * REMOVE: "+md.renderOWLObject(a, owl));
            if (isReplace) {
                var rest = javautil.collectionToJsArray(a.getClassExpressionsMinus(c));
                for (var bi in rest) {
                    var sca = owl.subClassOf(c, rest[bi]);
                    owl.addAxiom( sca );
                    this.report("    * ADD: "+md.renderOWLObject(sca, owl));
                    console.log("adding "+sca);
                }
            }
            owl.removeAxiom(a);
        }
    }
}



Linky.prototype.log = function(msg) {
    //console.log(msg);
}


Linky.prototype.report = function(msg) {
    if (this.io == null) {
        print(msg);
    }
    else {
        this.io.print(msg);
    }
}
