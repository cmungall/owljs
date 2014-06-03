
export('Dotty');

var javautil = require("owljs/javautil");
var md = require("owljs/io/markdown");


/* Function: Dotty
 *
 * Constructor
 *
 */
function Dotty(owl) {
    this.owl = owl;
    this.nodes = [];
    this.edge = [];
    return this;
}

Dotty.prototype.addNode = function(node) {
    this.nodes.push(node);
}

Dotty.prototype.addEdge = function(edge) {
    this.edges.push(edge);
    
}


Dotty.prototype.render = function() {
    this.w("digraph g {");
    var rsg = this.renderSubGraph;
    this.subgraphs.forEach(rsg);
    this.w("}");
    
}


