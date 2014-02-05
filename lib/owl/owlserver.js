var response = require('ringo/jsgi/response');
var OWL = require("owljs").OWL;

exports.install = function install(app, session) {
    // ROOT
    app.get('/', function(request) {
        var info = {};
        return response.json({hi:true});
    });

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


    app.get('/load/obolibrary/:ont', function(request, ont) {
        //var iri = resolveIRI(id);
        var owl = new OWL();
        session.owl = owl;
        var ontology = owl.loadOntology("http://purl.obolibrary.org/obo/"+ont+".owl");
        

        return response.json({success: true});
    });

    return app;
}
