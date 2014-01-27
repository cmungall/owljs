/* Namespace: obol
 
  Status:
  experimental
 
  When completed, will replace the old obol code for generating equivalence axioms from strings

  Rules:

  > {
  >  head: "NAME",
  >  body: TOKENLIST,
  >  gfun: FUNCTION
  > }
 
 
 */

export('Obol');

function Obol(owl, labelObjectMap) {
    this.owl = owl;
    if (labelObjectMap == null) {
        var repl = require("owl/repl");
        repl.owlinit(owl);
        labelObjectMap = repl.o;
    }
    this.labelObjectMap = labelObjectMap;
    return this;
}

Obol.rules = [];

Obol.add = function(r) {
    Obol.rules.push(r);
}

Obol.prototype.generate = function(v) {
    if (this.generateMap == null) {
        this.generateMap = {};
    }
    this.generateMap[v] = true;
}

Obol.prototype.setIgnoreDefinedClasses = function(v) {
    this.owl.config.isIgnoreDefinedClasses = v;
    return v;
}

Obol.prototype.isIgnoreDefinedClasses = function() {
    if (this.owl.config.isIgnoreDefinedClasses == null) {
        return false;
    }
    return this.owl.config.isIgnoreDefinedClasses;
}
Obol.prototype.isCompareClasses = function() {
    if (this.owl.config.isCompareClasses == null) {
        return false;
    }
    return this.owl.config.isCompareClasses;
}

Obol.prototype.useOboVocab = function() {
    var vocab = require("owl/vocab/obo");
    var owl = this.owl;
    this.setPropertyScore( vocab.hasBroadSynonym(owl), 5 );
    this.setPropertyScore( vocab.hasNarrowSynonym(owl), 5 );
    this.setPropertyScore( vocab.hasRelatedSynonym(owl), 5 );
    this.setPropertyScore( vocab.hasExactSynonym(owl), 50 );
    this.setPropertyScore( owl.labelProperty(), 50 );
}

Obol.prototype.setPropertyScore = function(p, s) {
    if (this.owl.config.propertyScoreMap == null) {
        // use a java map, as this can be keyed by OWL properties
        this.owl.config.propertyScoreMap = new java.util.HashMap();
    }
    this.owl.config.propertyScoreMap.put(p, s);
}

Obol.prototype.getLabelEntries = function() {
    if (this.labelEntries == null) {
        this.createLabelEntries();
    }
    return this.labelEntries;
}

// creates a list of objects mapping lexical elements
// (labels, syns, etc) to objects
Obol.prototype.createLabelEntries = function() {
    var owl = this.owl;
    var clist = owl.getClasses();
    var elist = [];
    for (var k in clist) {
        var c = clist[k];
        var anns = owl.getAnnotations(c);
        for (var ka in anns) {
            var ann = anns[ka];
            var p = ann.getProperty();
            var v = ann.getValue();
            var score = this.getAnnotationScore(p, v);
            if (v.getLiteral != null) {
                var vlit = v.getLiteral() + "";
                var score = this.getAnnotationScore(p, vlit);
                if (score != null) {
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
    }
    this.labelEntries = elist;
}

Obol.prototype.getAnnotationScore = function(p, v) {
    var pscore = 1;
    var smap = this.owl.config.propertyScoreMap;
    if (smap == null) {
        //console.warn("No property map configured");
        pscore = 1; // not configured - everything has score of 1
    }
    else {
        if (smap.containsKey(p)) {
            pscore = smap.get(p);
        }
        else {
            return null;
        }
    }
    return pscore + v.length;
}

Obol.prototype.parseClass = function(c, head) {
    if (this.isIgnoreDefinedClasses()) {
        if (c.getEquivalentClasses(this.owl.getOntology().getImportsClosure()).size() > 0) {
            this.log("Ignoring class with equiv axiom: "+c);
            return [];
        }
    }
    var ml = this.parse(c, head);
    for (var k in ml) {
        var m = ml[k];
        var ax = this.owl.equivalentClasses(c, m.expression);
        m.axiom = ax;
        m.ruleName = m.ruleName;
        if (this.isCompareClasses()) {
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
        }   
    } 
    return ml;
}

Obol.prototype.parseAll = function(head) {
    var owl = this.owl
    var cs = owl.getClasses();
    return this.parseClasses(cs, head);
}

Obol.prototype.parseSubClasses = function(c, head) {
    var owl = this.owl
    var cs = owl.getInferredSubClasses(c);
    return this.parseClasses(cs, head);
}

Obol.prototype.parseClasses = function(cs, head) {
    var results = [];
    for (var k in cs) {
        var c = cs[k];
        results = results.concat(this.parseClass(c, head));
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
Obol.prototype.parse = function(qstr, head) {
    var ml = [];
    if (typeof qstr != 'string') {
        var anns = this.owl.getAnnotations(qstr);
        for (var k in anns) {
            var ann = anns[k];
            // TODO - restriction labels and synonyms; TODO - score
            var val = ann.getValue();
            if (val.getLiteral != null && val.getLiteral() != null) {
                var vlit = val.getLiteral().toString();
                ml = ml.concat(this.parse(vlit, head));
            }
        }
        return ml;
    }
    this.log("Checking, #rules = "+Obol.rules.length);
    var n=0;
    for (var k in Obol.rules) {
        var r = Obol.rules[k];
        if (head == null || r.head == head) {
            n++;
            this.log("Parsing "+qstr+" with "+head);
            var m = this.parseWith(qstr, r); 
            if (m != null) {
                var x = r.gfun.call(this, this.labelObjectMap, m.bindings, this.owl);
                var score = m.score;
                if (r.score != null) {
                    score += r.score;
                }
                var match = {
                    expression : x,
                    ruleName : r.head,
                    score : score,
                    extraAxioms : m.extraAxioms
                };
                ml.push(match);
            }
        }
    }
    this.log("Rules tested: "+n+" / "+Obol.rules.length);
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
Obol.prototype.parseWith = function(qstr, rule) {
    var head = rule.head;
    var body = rule.body;

    return this.matchTokens(qstr, body);
}

Obol.prototype.matchTokens = function(qstr, toksToMatch) {

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
    var m = this.matchToken(qstr, nextToken, remainingTokens);
    if (m == null) {
        return null;
    }
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
Obol.prototype.matchToken = function(qstr, tok, remainingTokens) {
    this.log("Matching '"+tok+"' in '"+qstr+"'");

    // test if token is a string - if so, match on terminal
    if (typeof tok == 'string') {
        if (qstr.indexOf(tok) == 0) {
            this.log("  Matches "+tok);
            return {
                qstr : qstr.slice(tok.length),
                bindings : {},
                score : 0
            };
        }
        return null;
    }

    // token is an object / nonterminal
    // e.g. { type : o.neuron, name: "cell" }
    var owl = this.owl;
    var labelEntries = this.getLabelEntries();
    var tc = null;
    if (tok.type != null) {
        tc = owl.find(tok.type);
    }

    var candidates = [];
    for (var k in labelEntries) {
        var entry = labelEntries[k];
        var s = entry.label;
        if (qstr.indexOf(s) == 0) {
            if (tc == null ||
                owl.getInferredSuperClasses(entry.obj).indexOf(tc) != -1) {

                if (remainingTokens.length > 0 && s == qstr) {
                    // do not consume the whole query if there are more tokens to match
                    continue;
                }

                this.log("  Candidate: "+entry.obj+" Score="+entry.score);
                candidates.push({
                    qstr: qstr.substr(s.length),
                    obj : entry.obj,
                    score : entry.score
                });
            }
        }
    }

    // attempt to force class creation
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
                extraAxioms.push(this.owl.subClassOf(c, tok,type));
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

Obol.prototype.mergeBindings = function(h1, h2) {
    var h = {};
    for (var k in h1) {
        h[k] = h1[k];
    }
    for (var k in h2) {
        h[k] = h2[k];
    }
    return h;
}

Obol.prototype.log = function(m) {
    if (this.logLevel != null) {
        console.log(m);
    }
    else {
        this.owl.log(m);
    }
}
