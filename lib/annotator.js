/* Namespace: annotator
 

 
 */

export('Annotator');

/* Function: Annotator
 *
 * Constructor
 *
 * Arguments:
 * - owl : an <OWL> object
 * - labelObjectMap : (optional) lookup table, from labels to OWLObjects
 *
 */
function Annotator(owl, labelObjectMap) {
    this.owl = owl;
    if (labelObjectMap == null) {
        var repl = require("owljs/repl");
        repl.owlinit(owl);
        labelObjectMap = repl.o;
    }
    this.labelObjectMap = labelObjectMap;
    return this;
}


/* Function: useOboVocab
 *
 * Set this if the default OBO Vocabulary and scores are to be used
 *
 * - labels and exact synonyms score high
 * - broad, narrow and related synonyms are lower
 *
 * This also includes the NIF "obo" annotation property
 * for synonym TODO IAO
 *
 */
Annotator.prototype.useOboVocab = function() {
    var vocab = require("owljs/vocab/obo");
    var nif = require("owljs/vocab/nif");
    var owl = this.owl;
    this.setPropertyScore( vocab.hasBroadSynonym(owl), 5 );
    this.setPropertyScore( vocab.hasNarrowSynonym(owl), 5 );
    this.setPropertyScore( vocab.hasRelatedSynonym(owl), 5 );
    this.setPropertyScore( nif.synonym(owl), 25 );
    this.setPropertyScore( vocab.hasExactSynonym(owl), 50 );
    this.setPropertyScore( owl.labelProperty(), 50 );
}

/* Function: restrictProperties
 *
 * restrict the set of annotation properties used to find a lexical label
 * for a term to the specified set.
 *
 * if no annotation vocabulary has been set, the specified set of
 * properties will be used with a default score.
 *
 * A typical scenario is to call useOboVocab(), and then to restrict
 * the set (e.g. to exact syns and labels) using this method
 *
 *
 * Arguments:
 *  - ps : <owlapi.OWLAnnotationProperty> [] (or a list of IRIs)
 *
 */
Annotator.prototype.restrictProperties = function(ps) {
    var t = this;
    var owl = this.owl;
    var ps = ps.map( function(p) { return owl.annotationProperty(p) } );
    if (this.owl.config.propertyScoreMap == null) {
        // set defaults
        ps.forEach(function(p) { t.setPropertyScore(p, 5) });
    }
    else {
        var psm = this.owl.config.propertyScoreMap;
        var piris = ps.map( function(p) { return owl.getStringIRI(p) } );
        var psm2 = {};
        for (var k in ps) {
            var p = ps[k];
            var piri = owl.getStringIRI(p);
            psm2[piri] = psm[piri];
        }
        this.owl.config.propertyScoreMap = psm2;
    }
}

/* Function: setPropertyScore
 *
 * Each annotation property used in a parse is assigned a score,
 * that can be set here
 *
 *
 * Arguments:
 *  - p : <owlapi.OWLAnnotationProperty>
 *  - s : number
 *
 */
Annotator.prototype.setPropertyScore = function(p, s) {
    if (this.owl.config.propertyScoreMap == null) {
        this.owl.config.propertyScoreMap = {};
    }
    this.owl.config.propertyScoreMap[this.owl.getStringIRI(p)] = s;
}

Annotator.prototype.getLabelEntries = function() {
    if (this.labelEntries == null) {
        this.createLabelEntries();
    }
    return this.labelEntries;
}

// creates a list of objects mapping lexical elements
// (labels, syns, etc) to objects
Annotator.prototype.createLabelEntries = function() {
    var owl = this.owl;
    var clist = owl.getClasses();
    var elist = [];
    for (var k in clist) {
        var c = clist[k];
        elist = elist.concat(this.getLabelEntriesForObject(c));
    }
    this.labelEntries = elist;
}

Annotator.prototype.getLabelEntriesForObject = function(c) {
    var owl = this.owl;
    var elist = [];
    var anns = owl.getAnnotations(c);
    for (var ka in anns) {
        var ann = anns[ka];
        var p = ann.getProperty();
        var v = ann.getValue();
        var score = this.getAnnotationScore(p, v);
        if (v.getLiteral != null) {
            var vlit = v.getLiteral() + "";
            if (!this.isRespectCase()) {
                vlit = vlit.toLowerCase();
            }
            var score = this.getAnnotationScore(p, vlit);
            if (score != null) {
                this.debug("LabelEntry: " + vlit + " " + score + " " + p +" " + c);
                elist.push(
                    {
                        label : vlit,
                        score : score,
                        property : p,
                        obj : c,
                    }
                );
            }
        }
    }
    return elist;
}

Annotator.prototype.getAnnotationScore = function(p, v) {
    var pscore = 1;
    var smap = this.owl.config.propertyScoreMap;
    if (smap == null) {
        //console.warn("No property map configured");
        pscore = 1; // not configured - everything has score of 1
    }
    else {
        var piri = this.owl.getStringIRI(p);
        if (smap[piri] != null) {
            pscore = smap[piri];
        }
        else {
            return null;
        }
    }
    return pscore + v.length;
}


/* Function: parseClass
 *
 * parses a class using <parse>
 *
 * Arguments:
 *  - c : <owlapi.OWLClass>
 *
 * Returns:
 *  a list of match objects
 */
Annotator.prototype.parseClass = function(c, opts) {
    if (this.isIgnoreDefinedClasses()) {
        if (c.getEquivalentClasses(this.owl.getOntology().getImportsClosure()).size() > 0) {
            this.log("Ignoring class with equiv axiom: "+c);
            return [];
        }
    }
    var ml = this.parse(c, opts);
    var filteredMatches = [];
    for (var k in ml) {
        var m = ml[k];
        m.obj = c;
        m.iri = c.getIRI().toString();
        var ax = this.owl.equivalentClasses(c, m.expression);
        m.axiom = ax;
        m.ruleName = m.ruleName;
        if (this.isCompareClasses() || this.isSubsumersOnly()) {
            var owl = this.owl;
            var eqs = owl.getInferredEquivalentClasses(m.expression);
            if (eqs.indexOf(c) > -1) {
                m.compare = "EquivalentTo";
            }
            else {
                var supers = owl.getInferredSuperClasses(m.expression, false, false);
                if (supers.indexOf(c) > -1) {
                    m.compare = "SubClassOf";
                }
                else {
                    var subs = owl.getInferredSubClasses(m.expression, false, false);
                    if (subs.indexOf(c) > -1) {
                        m.compare = "SuperClassOf";
                    }
                    else {
                        m.compare = "UnrelatedTo";
                    }
                }
            }
            if (this.isSubsumersOnly()) {
                if (m.compare != 'SuperClassOf') {
                    continue;
                }
            }
        }   
        filteredMatches.push(m);
    } 
    return filteredMatches;
}

Annotator.prototype.parseAll = function(head) {
    var owl = this.owl
    var cs = owl.getClasses();
    return this.parseClasses(cs, head);
}

/* Function: parseSubClass
 *
 * parses a list of classes using <parse>, restricting
 * classes parsed to subtypes of a particular class,
 * e.g. 'neuron'
 *
 * Arguments:
 *  - c : <owlapi.OWLClass>, the root class to use
 *  - head : the name of a rule to apply (optional)
 *
 * Returns:
 *  a list of match objects
 */
Annotator.prototype.parseSubClasses = function(c, head) {
    var owl = this.owl
    var cs = owl.getInferredSubClasses(c, false, true);
    return this.parseClasses(cs, head);
}

/* Function: parseClasses
 *
 * parses a list of classes using <parseClass>
 *
 * Arguments:
 *  - cs : <owlapi.OWLClass> []
 *  - head : the name of a rule to apply (optional)
 *
 * Returns:
 *  a list of match objects
 */
Annotator.prototype.parseClasses = function(cs, head) {
    var results = [];
    for (var k in cs) {
        var c = cs[k];
        var cresults = this.parseClass(c, head);
        if (cresults.length > 0) {
            results.push(cresults[0]);
            if (cresults.length > 1) {
                this.warn("Ignoring multiple results for "+c);
            }
        }
    }
    return results;
}

/* Function: parse
 *
 *
 * Arguments:
 *  - qstr : string to parse OR an <owlapi.OWLNamedObject>
 *  - head : (optional) head/name of rule to use (uses all if not specified)
 *
 * Returns:
 *  list of match objects
*/
Annotator.prototype.parse = function(qstr, head, baseScore, property, qobj) {
    var ml = [];

    // if argument is a class, perform parse on all labels
    if (typeof qstr != 'string') {
        var elist = this.getLabelEntriesForObject(qstr);
        for (var k in elist) {
            var e = elist[k];
            ml = ml.concat(this.parse(e.label, head, e.score, e.property, qstr));
        }
        return ml;
    }

    // argument must be string at this point
    //this.log("Checking, #rules = "+Annotator.rules.length);
    var n=0;
    for (var k in Annotator.rules) {
        var r = Annotator.rules[k];
        if (head == null || r.head == head) {
            n++;
            var m = this.parseWith(qstr, r); 
            if (m != null) {
                var x = r.gfun.call(this, this.labelObjectMap, m.bindings, this.owl);
                if (x.getClassesInSignature().contains(qobj)) {
                    //console.log("Skipping "+qobj+" == "+x);
                    m = null;
                }
                else {
                    var score = m.score;
                    if (r.score != null) {
                        score += r.score;
                    }
                    var match = {
                        query : qstr,
                        property : property,
                        expression : x,
                        expressionStr : x.toString(),
                        ruleName : r.head,
                        score : score + baseScore,
                        extraAxioms : m.extraAxioms
                    };
                    ml.push(match);
                }
            }
        }
    }
    //this.log("Rules tested: "+n+" / "+Annotator.rules.length);
    if (n ==0) {
        console.error("No rules tested");
    }
    // TODO - sort
    ml.sort(function(a,b){return a.score<b.score});
    return ml;
}

/* parses a query string given a production rule.

   match object keys:

   - qstr : the input strict matched
   - bindings : dictionary mapping variables in rule body to their bound values
   - score : strength of match. Currently longer strings score higher.
*/
Annotator.prototype.parseWith = function(qstr, rule) {
    var head = rule.head;
    var body = rule.body;

    // for efficiency, pre-check to ensure all terminals are present
    for (var k in body) {
        var tok = body[k];
        if (typeof tok == 'string') {
            // tok is a terminal
            if (qstr.indexOf(tok) == -1) {
                return null;
            }
        }
    }
    this.log("Passed pre-test: '"+qstr+"' in rule: "+head);

    return this.matchTokens(qstr, body);
}

// toksToMatch : a list of tokens which is the body of a rule
//

// e.g. [{name: "cell", type: "cell"}, " development"]
Annotator.prototype.matchTokens = function(qstr, toksToMatch) {

    // BASE CASE - nothing left to match
    if (toksToMatch.length == 0) {
        if (qstr.length == 0) {
            return {
                bindings: {},
                score: 0
            };
        }
        else {
            return null;
        }
    }

    var nextToken = toksToMatch[0];
    var remainingTokens = toksToMatch.slice(1);
    this.debug("Token: " + nextToken+" qstr="+qstr);
    var m = this.matchToken(qstr, nextToken, remainingTokens);
    if (m == null) {
        this.debug("Failed to match: " + nextToken);
        return null;
    }
    this.debug("Matched Token: '" + nextToken + "' Remaining: "+remainingTokens+" m="+m.qstr+" Match obj: "+m.obj);
    var ms = this.matchTokens(m.qstr, remainingTokens);
    if (ms == null) {
        return null;
    }
    return {
        // todo - merge scores etc
        bindings : this.mergeBindings(m.bindings, ms.bindings),
        score : m.score + ms.score,
        extraAxioms : nconcat(m.extraAxioms, ms.extraAxioms)
    };
    
}

function nconcat(a,b) {
    if (a == null) { a = [] }
    if (b == null) { b = [] }
    return a.concat(b);
}

/*
 * E.g.
 * > tok = { type: 'protein complex', name: 'complex', ... }
 *
 * returns:
 *  - match object if matched
 *  - or null if no match
 */
Annotator.prototype.matchToken = function(qstr, tok, remainingTokens) {
    //this.log("Matching '"+tok+"' in '"+qstr+"'");

    // test if token is a string - if so, match on terminal
    if (typeof tok == 'string') {
        if (qstr.indexOf(tok) == 0) {
            this.debug("  StringMatches "+tok);
            return {
                qstr : qstr.slice(tok.length),
                bindings : {},
                score : 0
            };
        }
        this.debug("  No match for "+qstr);
        return null;
    }

    // token is an object / nonterminal
    // e.g. { type : o.neuron, name: "cell" }
    var owl = this.owl;
    var labelEntries = this.getLabelEntries();
    var tc = null;
    if (tok.type != null) {
        if (typeof tok.type =='string') {
            tok.type = owl.find(tok.type);
        }
        tc = tok.type;
    }

    this.debug("  Iterating over call labelEntries to token: "+tok.name+ " in query: "+qstr);
    var candidates = [];
    for (var k in labelEntries) {
        var entry = labelEntries[k];
        var s = entry.label;
        if (qstr.indexOf(s) == 0) {
            this.debug("  String match, now checking if "+entry.obj+" is a subclass of "+tc);
            if (tc == null ||
                owl.isInferredSubClassOf(entry.obj, tc)) {

                if (remainingTokens.length > 0 && s == qstr) {
                    // do not consume the whole query if there are more tokens to match
                    continue;
                }

                this.debug("  Candidate: "+entry.obj+" Score="+entry.score);
                this.debug("");
                candidates.push({
                    qstr: qstr.substr(s.length),
                    obj : entry.obj,
                    score : entry.score
                });
            }
        }
    }

    // attempt to force class creation; only if asked and there are no candidates
    if (candidates.length == 0 && this.generateMap != null && this.generateMap[tok.name]) {
        // force a match on generated term
        this.log("Forcing match for "+qstr);
        var label = null;
        if (remainingTokens.length == 0) {
            label = qstr; // match rest of query
        }
        else {
            var qtoks = qstr.split(" ");
            for (var i=1; i<qtoks.length; i++) {
                var rest = " "+qtoks.slice(i).join(" ");
                // attempt match for varying lengths
                if (this.matchTokens(rest, remainingTokens) != null) {
                    label = qtoks.slice(0, i).join(" ");
                    break;
                }
            }
        }
        if (label == null) {
            this.log("Could not force match for "+qstr);
            return null;
        }
        else {
            var c = this.owl.class(this.owl.genIRI());
            // axioms for new class
            var extraAxioms =
                [
                    this.owl.declaration(c),
                    this.owl.labelAssertion(c, label)
                ];
            if (tok.type != null) {
                if (typeof tok.type =='string') {
                    tok.type = owl.find(tok.type);
                }
                extraAxioms.push(this.owl.subClassOf(c, tok.type));
            }
            var m = 
                {
                    qstr: qstr.slice(label.length),
                    obj : c,
                    bindings : {},
                    extraAxioms : extraAxioms,
                    score : 1
                };
            m.bindings[tok.name] = c;
            return m;
        }
    }

    if (candidates.length == 0) {
        return null;
    }

    candidates.sort(
        function(i,j) {
            return i.score < j.score;
        });

    var c = candidates[0];
    var b = {};
    b[tok.name] = c.obj;
    return {
        qstr : c.qstr,
        bindings : b ,
        score : c.score
    };
}

Annotator.prototype.mergeBindings = function(h1, h2) {
    var h = {};
    for (var k in h1) {
        h[k] = h1[k];
    }
    for (var k in h2) {
        h[k] = h2[k];
    }
    return h;
}

Annotator.prototype.log = function(m) {
    if (this.logLevel != null) {
        console.log(m);
    }
    else {
        this.owl.log(m);
    }
}

Annotator.prototype.debug = function(m) {
    if (this.logLevel != null && this.logLevel > 2) {
        console.log(m);
    }
}

// MAY BE DEPRECATED IN FUTURE
Annotator.prototype.writeOboFile = function(fn, results) {
    var fs = require('fs');
    var s = fs.open(fn, {write: true});
    for (var k in results) {
        this.writeObo(s, results[k]);
    }
    fs.close();
}
Annotator.prototype.writeObo = function(s, r) {
    var axiom = r.axiom;
    var obj = r.obj;
    var xs = axiom.getClassExpressions();
    for (var k in xs) {
        var x = xs[k];
        if (!x.equals(obj)) {
            continue;
        }
        s.writeLine("[Term]");
        s.writeLine("id: " + getId(r.obj) + " ! "+this.owl.getLabel(obj));
        s.writeLine("intersection_of: " + getId(r.obj) + " ! "+this.owl.getLabel(obj));
    }

}


