var response = require('ringo/jsgi/response');
var OWL = require("owl").OWL;
export('OWLServices');

// - app: stick application
// - session: dict containing keys: owl, ...
function OWLServices(app, session) {
    this.app = app;
    this.session = session;
    this.owl = session.owl;
    print("initialized with:"+session);
    print("initialized with:"+session.foo);

    var owl = session.owl;

    this.resolveClass = function(id) {
        print("Resolving:"+id);
        var iri = this.resolveIRI(id);
        return owl.df().getOWLClass(iri);
    }

    this.resolveIRI = function(id) {
        print("mkIRI:"+id);
        return owl.getIRI("http://purl.obolibrary.org/obo/" + id.replace(":","_"));
    }

    // TODO
    this.json = function(objs) {
        return objs;
    }

    this.jsonList = function(objs) {
        var jsonObj = {
            "num" : objs.length,
            "results" : [ ]
        };
        return jsonObj;
    }

    var holder = this;

    app.get('/status', function(request) {
        if (session.owl == null) {
            return response.json({ontology: null});
        }
        else {
            return response.json({ontology: session.owl.getOntologyIRI().toString()});
        }
    });

    app.get('/ancestors/:cls/:property', function(request, cls, property) {
        // TODO
        //var ancs = owl.getAncestorsOver(owl.resolveIdentifier(cls), property);
        //return response.json({ontology: session.owl.getOntologyIRI().toString()});
    });

    app.get('/superclasses/:clsId', function(request, clsId) {
        // TODO
        console.log("t this = "+ typeof this);
        console.log("this.rc = "+ this.resolveClass);
        var cls = holder.resolveClass(clsId);
        console.log("cls="+cls);
        var ancs = owl.getInferredSuperClasses(cls);
        console.log("ancs="+ancs);
        var jsonObj = holder.jsonList(ancs);
        console.log("j="+JSON.stringify(jsonObj));
        var rv = response.json( jsonObj );
        console.log("rv="+JSON.stringify(rv));
        return rv;
    });

    app.get('/load/obolibrary/:ont', function(request, ont) {
        //var iri = resolveIRI(id);
        var owl = new OWL();
        session.owl = owl;
        var ontology = owl.loadOntology("http://purl.obolibrary.org/obo/"+ont+".owl");
        

        return response.json({success: true});
    });


}
//exports.owlservices = OWLServices;

