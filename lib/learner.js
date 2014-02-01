
var Learner = exports.Learner = function Learner(owl) {
    this.owl = owl;
    this.reasonerType = "fast instance checker";
    //this.lpType = "posNegStandard";
    this.algType = "celoe";
    
    this.positiveIndividualMap = {};
    this.negativeIndividualMap = {};
}

Learner.prototype.getPositiveIds = function() {
    return Object.keys(this.positiveIndividualMap);
}
Learner.prototype.getNegativeIds = function() {
    return Object.keys(this.positiveIndividualMap);
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
    this.rendernl("prefixes = [ ");
    for (var k in this.prefixMap) {
        var url = this.prefixMap[k];
        // todo - check delimiter rules
        this.rendernl("("+this.quote(k)+","+this.quote(prefixMap[k])+")");
    }
    this.render("]");

    // knowledge source definition
    this.rendernl('ks.type = "OWL File"');
    this.rendernl("ks.fileName = "+this.quote(this.owlFile));

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

    if (this.getNegativeIndividualMap != null) {
        this.rendernl("lp.negativeExamples = {");
        this.render(this.getNegativeIds().map(this.quote).join(",\n"));
        this.rendernl("}");
    }

    // create learning algorithm to run
    this.rendernl("alg1.type = "+this.quote(this.algType));
    //alg2.type = "pceloe"
}

Learner.prototype.getLPType = function() {
    //lp.type = "posNegStandard"
    //lp.type = "classLearning"
    //lp.type = "posOnlyLP"
    if (this.getNegativeIndividualMap == null) {
        return "posOnlyLP";
    }
    else {
        return "posNegStandard";
    }
}

Learner.prototype.render = function(s) {
    print(s);
}
Learner.prototype.rendernl = function(s) {
    return this.render(s + "\n");
}
Learner.prototype.quote = function(s) {
    return '"'+s+'"';
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
