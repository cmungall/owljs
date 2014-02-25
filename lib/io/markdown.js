
var infixMap =
    {
        SubClassOf : "SubClassOf",
        EquivalentClasses: "EquivalentTo",
        ObjectIntersectionOf: "and",
        ObjectUnionOf: "or",
        ObjectComplementOf: "or",
    }

var render = exports.renderOWLObject = function(obj, owl, opts) {
    return render(owl.toAxiomaticJSON(obj), owl, opts);
}

var render = exports.render = function(obj, owl, opts) {
    var cx = this;
    if (typeof obj == 'object') {
        var md;
        var type = obj.type;
        var xargs = obj.args.map( function(a) { return cx.render(a, owl, opts) });
        if (infixMap[type] != null) {
            md = xargs.join(" **"+infixMap[type]+"** ");
        }
        else {
            if (type == 'AnnotationAssertion') {
                md = xargs[1] + " *" + xargs[0] +"* " + xargs[2];
            }
            else if (type == 'ObjectSomeValuesFrom') {
                md = xargs[0] + " **some** " + xargs[1];
            }
            else {
                md = type + "( " + xargs.join(" ")+" ) ";
            }
        }
        if (obj.annotations != null) {
            md += ' { ' + obj.annotations.map( function(a) { return cx.render(a.property, owl, opts)+"="+cx.render(a.value, owl, opts) }).join(" , ") + ' } ';
        }
        return md;
    }
    else {
        var label = owl.getLabel(obj);
        if (label == null) {
            var hpos = obj.indexOf("#");
            if (hpos > -1) {
                label = obj.slice(hpos + 1);
            }
        }
        if (label == null) {
            return obj;
        }
        else {
            if (opts != null && opts.isLabelOnly) {
                return label;
            }
            return "[" + label+"]("+obj+")";
        }
    }
}
