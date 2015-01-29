/* Namespace: Learner
 *
 * Helper for DL-Learner package
 *
 *
 * Scripts:
 *  - owljs-
 *
 *
 * Tests:
 *  - test/learner/
 *
 */

importPackage(Packages.org.semanticweb.owlapi.model);

var fs = require('fs');

/* Function: Learner
 *
 * Constructor
 *
 * Arguments:
 *  - owl: an <OWL> object
 */
var Learner = exports.Learner = function Learner(owl) {
    this.owl = owl;
    this.reasonerType = "fast instance checker";
    //this.lpType = "posNegStandard";
    this.algType = "celoe";
    //this.algType = "eltl";  // does not work with noise?
    this.dir = "target";
    
    this.positiveIndividualMap = {};
    this.negativeIndividualMap = {};
    this.paramMap = {};
}

Learner.prototype.setInputFile = function(fn) {
    if (this.owl == null) {
        var {OWL} = require("owljs");
        this.owl = new OWL();
    }
    this.owl.loadOntology(fn);
    this.owlFile = fn;
}

Learner.prototype.setStream = function(io) {
    this.io = io;
}

Learner.prototype.getPositiveIds = function() {
    return Object.keys(this.positiveIndividualMap);
}
Learner.prototype.getNegativeIds = function() {
    return Object.keys(this.negativeIndividualMap);
}
Learner.prototype.hasPositiveIndividual = function(k) {
    return this.positiveIndividualMap[k] != null;
}

Learner.prototype.addPositiveIndividual = function(ind) {
    return this.addIndividual(this.positiveIndividualMap, ind);
}
Learner.prototype.addNegativeIndividual = function(ind) {
    return this.addIndividual(this.negativeIndividualMap, ind);
}
Learner.prototype.addIndividual = function(m, ind) {
    var id = this.getId(ind);
    m[id] = ind;
    return id;
}

Learner.prototype.setPositiveIndividuals = function(inds) {
    this.positiveIndividualMap = {};
    return this.addIndividuals(this.positiveIndividualMap, inds);
}
Learner.prototype.setNegativeIndividuals = function(inds) {
    this.negativeIndividualMap = {};
    return this.addIndividuals(this.negativeIndividualMap, inds);
}
Learner.prototype.addIndividuals = function(m, inds) {
    var lrn = this;
    return inds.map( function(x) { return lrn.addIndividual(m, x) } );
}

Learner.prototype.getId = function(ind) {
    return ind.getIRI();
}

Learner.prototype.renderConfig = function() {
    // prefixes
    if (this.prefixMap != null && Object.keys(this.prefixMap).length > 0) {
        this.rendernl("prefixes = [ ");
        for (var k in this.prefixMap) {
            var url = this.prefixMap[k];
            // todo - check delimiter rules
            this.rendernl("("+this.quote(k)+","+this.quote(prefixMap[k])+")");
        }
        this.render("]");
    }

    // knowledge source definition
    this.rendernl('ks.type = "OWL File"');
    //this.rendernl("ks.fileName = "+this.quote(this.owlFile));
    this.rendernl("ks.fileName = "+this.quote("tr.owl"));

    // reasoner
    this.rendernl("reasoner.type = "+this.quote(this.reasonerType));
    this.rendernl("reasoner.sources = { ks }");

    // learning problem
    //lp.type = "posNegStandard"
    //lp.type = "classLearning"
    //lp.type = "posOnlyLP"
    this.rendernl("lp.type = "+this.quote(this.getLPType()));

    this.rendernl("lp.positiveExamples = {");
    this.render(this.getPositiveIds().map(this.quote).join(",\n"));
    this.rendernl("}");

    if (this.negativeIndividualMap != null) {
        this.rendernl("lp.negativeExamples = {");
        this.render(this.getNegativeIds().map(this.quote).join(",\n"));
        this.rendernl("}");
    }

    for (var k in this.paramMap) {
        this.rendernl(k + " = " + this.paramMap[k]);
    }


    // create learning algorithm to run
    this.rendernl("alg1.type = "+this.quote(this.algType));
    //alg2.type = "pceloe"
}

Learner.prototype.getLPType = function() {
    //lp.type = "posNegStandard"
    //lp.type = "classLearning"
    //lp.type = "posOnlyLP"
    if (this.negativeIndividualMap == null) {
        return "posOnlyLP";
    }
    else {
        return "posNegStandard";
    }
}

Learner.prototype.render = function(s) {
    if (this.io == null) {
        print(s);
    }
    else {
        this.io.print(s);
    }
}
Learner.prototype.rendernl = function(s) {
    return this.render(s + "\n");
}
Learner.prototype.quote = function(s) {
    return '"'+s+'"';
}

Learner.prototype.setClassToLearn = function(c, backgroundClass) {

    var owl = this.owl;
    var insts = owl.getInferredInstances( c, false );
    
    for (var k in insts) {
        var u = insts[k];
        this.addPositiveIndividual(u);
    }

    if (backgroundClass == null) {
        this.negativeIndividualMap = null;
    }
    else {
        if (backgroundClass == 'Thing') {
            backgroundClass = owl.getOWLDataFactory().getOWLThing();
        }
        var bginsts = owl.getInferredInstances( backgroundClass, false);
        console.log("Drawing negative examples from set of: "+backgroundClass+" INSTS="+bginsts.length);

        for (var k in bginsts) {
            var u = bginsts[k];
            if (insts.indexOf(u) == -1) {
                this.addNegativeIndividual(u);
            }
        }
        
        
    }

    var rmAxioms = c.getReferencingAxioms(owl.getOntology());
    console.log("REMOVING: "+rmAxioms.size());
    owl.getManager().removeAxioms(owl.getOntology(), rmAxioms);
    if (false) {

    // remove axioms that would lead to trivial classification
    var rmAxioms = owl.getAllAxioms().filter(
        function(a) {
            if (a instanceof OWLClassAssertionAxiom) {
                var sups = owl.getInferredSuperClasses(a.getClassExpression(), false, true);
                //console.log(a + " SIPS: "+sups+" L="+sups.length);
                if (sups.filter(function(s){ return s.equals(c) }).length > 0) {
                    console.log("  Excluding: "+a+" because we are attempting to learn the classification for "+c);
                    return true;
                }
            }
        });

    console.log("REMOVING: "+rmAxioms.length);
    owl.removeAxioms(rmAxioms);
    }
    
}

Learner.prototype.prepLCS = function(c,d) {
    var owl = this.owl;
    
    var ci = owl.getInferredInstances( c );
    var di = owl.getInferredInstances( d );

    var cdu = ci.concat(di);
    
    for (var k in cdu) {
        var u = cdu[k];
        this.addPositiveIndividual(u);
    }
    this.negativeIndividualMap = null;
    
}

/*
Learner.prototype.FOOprepLCS = function(c,d) {
    var owl = this.owl;
    var cdi = owl.intersectionOf(c,d);
    this.setPositiveIndividuals(owl.getInferredInstances( cdi ));
    
    var ci = owl.getInferredInstances( c );
    var di = owl.getInferredInstances( d );

    var cdu = ci.concat(di);
    
    for (var k in cdu) {
        var u = cdu[k];
        if (this.hasPositiveIndividual(u)) {
            // do nothing
        }
        else {
            this.addNegativeIndividual(u);
        }
    }
}
*/

Learner.prototype.learn = function() {
    var subp = require("ringo/subprocess");

    this.owl.save(this.dir + "/tr.owl");
    var io = fs.open(this.dir + "/auto.conf", {write: true} );

    this.setStream(io);
    this.renderConfig();
    io.close();
    
    var cmd = "cli ./auto.conf";
    console.log("CMD: "+cmd);
    var out = subp.command(cmd, {dir: this.dir});
    return out;
}

Learner.prototype.learnOntology = function(learnOwl, bgOwl) {
    var cl = learnOwl.getClasses();
    var subp = require("ringo/subprocess");

    this.owl.save(this.dir + "/tr.owl");
    var io = fs.open(this.dir + "/auto.conf", {write: true} );

    this.setStream(io);
    this.renderConfig();
    io.close();
    
    var cmd = "cli ./auto.conf";
    console.log("CMD: "+cmd);
    var out = subp.command(cmd, {dir: this.dir});
    return out;
}
