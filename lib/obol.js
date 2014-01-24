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
    this.createLabelEntries();
    return this;
}

Obol.rules = [];

Obol.add = function(r) {
    Obol.rules.push(r);
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
            var v = ann.getValue();
            if (v.getLiteral != null) {
                // todo - customize permitted properties
                elist.push(
                    {
                        label : v.getLiteral(),
                        property : ann.getProperty(),
                        obj : c,
                        // score : TODO
                    }
                );
            }
        }
    }
    this.labelEntries = elist;
}

Obol.prototype.parseClass = function(c, head) {
    var ml = this.parse(c, head);
    for (var k in ml) {
        var m = ml[k];
        var ax = this.owl.equivalentClasses(c, m.expression);
        m.axiom = ax;
    }
    return ml;
}

Obol.prototype.parseAll = function(head) {
    var owl = this.owl
    var cs = owl.getClasses();
    var results = [];
    for (var k in cs) {
        var c = cs[k];
        results = results.concat(this.parse(c, head));
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
                console.log("Lit = "+vlit);
                ml = ml.concat(this.parse(vlit, head));
            }
        }
        return ml;
    }
    for (var k in Obol.rules) {
        var r = Obol.rules[k];
        console.log("R="+r);
        if (head == null || r.head == head) {
            console.log("Parsing "+qstr+" with "+head);
            var m = this.parseWith(qstr, r); 
            if (m != null) {
                console.log("b="+m.bindings);
                console.log("labelObjectMap="+this.labelObjectMap+" "+this.labelObjectMap.part_of);
                var x = r.gfun.call(this, this.labelObjectMap, m.bindings);
                var match = {
                    expression : x
                };
                ml.push(match);
            }
        }
    }
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

    print(JSON.stringify(toksToMatch));
    if (toksToMatch.length == 0) {
        if (qstr.length == 0) {
            return {
                bindings: {}
            };
        }
        else {
            return null;
        }
    }

    var m = this.matchToken(qstr, toksToMatch[0]);
    if (m == null) {
        return null;
    }
    var ms = this.matchTokens(m.qstr, toksToMatch.slice(1));
    if (ms == null) {
        return null;
    }
    return {
        // todo - merge scores etc
        bindings : this.mergeBindings(m.bindings, ms.bindings)
    };
    
}

/*
 * E.g.
 * > tok = { type: 'protein complex', name: 'complex', ... }
 *
 * returns match object if matched, or null if no match
 */
Obol.prototype.matchToken = function(qstr, tok) {
    console.log("Matching '"+tok+"' in '"+qstr+"'");
    if (typeof tok == 'string') {
        console.log(" smatch...");
        if (qstr.indexOf(tok) == 0) {
            console.log("  Matches "+tok);
            return {
                qstr : qstr.slice(tok.length),
                bindings : {}
            };
        }
        return null;
    }
    var owl = this.owl;
    var labelEntries = this.labelEntries;
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
                // TODO - exclude original object from parse, greedy match, no backtracking
                console.log("  Candidate: "+entry.obj);
                candidates.push({
                    qstr: qstr.substr(s.length),
                    obj : entry.obj,
                    score : s.length
                });
            }
        }
    }

    candidates = candidates.sort(
        function(i,j) {
            return i.score < j.score;
        });

    if (candidates.length == 0) {
        return null;
    }
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

