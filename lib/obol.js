/* Namespace: obol
 *
 * Status:
 * experimental
 *
 * When completed, will replace the old obol code for generating equivalence axioms from strings
 *
 */

export('Obol');

function Obol(owl) {
    this.owl = owl;
    this.createLabelEntries();
    return this;
}

Obol.rules = [];

Obol.add = function(r) {
    Obol.rules.push(r);
}

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
                elist.push(
                    {
                        label : v.getLiteral(),
                        property : ann.getProperty(),
                        obj : c
                    }
                );
            }
        }
    }
    this.labelEntries = elist;
}

/* Function: parse
 *
 *
 * Arguments:
 *  - qstr : string to parse
 *  - head : head/name of rule to use
 *  - repl : a repl object (used for generation)
 *
 * Returns:
 *  list of generated class expressions
*/
Obol.prototype.parse = function(qstr, head, repl) {
    var ml = [];
    if (qstr.getAnnotations != null) {
        var anns = this.owl.getAnnotations(qstr);
        for (var k in anns) {
            var ann = anns[k];
            // TODO - restriction labels and synonyms; TODO - score
            var val = ann.getValue();
            if (val.getLiteral != null && val.getLiteral() != null) {
                ml = ml.concat(this.parse(val.getLiteral(), head, repl));
            }
        }
        return ml;
    }
    for (var k in Obol.rules) {
        var r = Obol.rules[k];
        console.log("R="+r);
        if (head == null || r.head == head) {
            var m = this.parseWith(qstr, r); 
            if (m != null) {
                console.log("b="+m.bindings);
                var x = r.gfun.call(this, repl, m.bindings);
                ml.push(x);
            }
        }
    }
    return ml;
}


Obol.prototype.parseWith = function(qstr, rule) {
    var head = rule.head;
    var body = rule.body;

    return this.matchTokens(qstr, body);
}

Obol.prototype.matchTokens = function(qstr, toksToMatch) {

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
        bindings : this.mergeBindings(m.bindings, ms.bindings)
    };
    
}

/*
 * E.g.
 * > tok = { type: 'protein complex', name: 'complex', ... }
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

