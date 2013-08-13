// We include server.js in the top level to simplify deployment on heroku

require('./lib/owl.js');


var stick = require('stick');
var Mustache = require('ringo/mustache');
var fs = require('fs');
var response = require('ringo/jsgi/response');

var httpclient = require('ringo/httpclient');
var OWL = require("./lib/owl").OWL;

var app = exports.app = new stick.Application();
app.configure('route');
app.configure('params');
app.configure('static');

var owl = new OWL();
owl.loadOntology("test/caro.owl");


// STATIC HELPER FUNCTIONS. May become OO later.
function getTemplate(t) {
    var s = fs.read('templates/'+t+'.mustache');
    return s;
}

function staticTemplate(t) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate(t), info));
}

function serveDirect(loc,page,ctype) {
    var s = fs.read(loc+'/'+page);
    return {
      body: [Mustache.to_html(s,{})],
      headers: {'Content-Type': ctype},
      status: 200
   }
}

// This function takes a json representation of some data
// (for example, a disease and various associated genes, phenotypes)
// intended to be rendered by some template (e.g. disease.mustache) and
// adds additional functions or data to be used in the template.
function addCoreRenderers(info, type, id) {
    info['@context'] = "/conf/monarch-context.json"
    info.scripts = [
        {"url" : "/js/jquery-1.9.1.min.js"},
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/js/bootstrap.min.js"},
    ];
    info.stylesheets = [
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/css/bootstrap.min.css"},
    ];
    if (id != null) {
        info.base_url = "/"+type+"/"+id;
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        console.log("DN:"+JSON.stringify(info.download));
    }
    info.css = {};
    info.css.table = "table table-striped table-condensed";
    if (info.relationships != null) {
        info.ontNavBox = function(){ return genOntologyGraphInfo(type, id, info.relationships) };
    }
    info.includes = {};
    info.includes.navbar = Mustache.to_html(getTemplate('navbar'), {});
    info.includes.navlist = Mustache.to_html(getTemplate('navlist'), {});
    info.includes.rightlist = Mustache.to_html(getTemplate('rightlist'), {});
}

// ROOT
app.get('/', function(request) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate('main'), info));
});

// CSS: pass-thru
app.get('/css/:page', function(request,page) {
    return serveDirect('css',page,'text/css');
});
// JS: pass-thru
app.get('/js/:page', function(request,page) {
   return serveDirect('js',page,'text/plain');
});
// IMG: pass-thru
app.get('/image/:page', function(request,page) {
    var s = fs.read('./image/'+page, {binary:true});
    return {
      body: [s],
      headers: {'Content-Type': 'image/png'},
      status: 200
   }
});

// SEARCH
// currently searches over ontologies using OQ
app.get('/search/:term?.:fmt?', function(request, term, fmt) {
    if (request.params.search_term != null) {
        term = request.params.search_term;
    }
    var results = engine.searchOverOntologies(term);
    var info =
        {
            results: results
        };
    if (fmt != null) {
        return formattedResults(info, fmt);
    }

    // HTML
    addCoreRenderers(info, 'search', term);
    
    // adorn object with rendering functions
    info.resultsTable = function() {return genTableOfSearchResults(info.results)} ;

    return response.html(Mustache.to_html(getTemplate('search_results'), info));    
});

// ENTITY PAGE
// Status: working but needs work
app.get('/entity/:id.:fmt?', function(request, id, fmt) {
    var iri = resolveIRI(id);
    if (iri != id) {
        console.log("redirecting: "+id+" ==> "+iri);
        return response.redirect(genURL('entity',iri));
    }

    var obj = owl.generateJSON(iri);
    if (fmt != null) {
        return formattedResults(obj, fmt);
    }

    // HTML
    //addCoreRenderers(info, 'entity', id);
    
    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfEntityPhenotypeAssociations(info.phenotype_associations)} ;
    info.geneTable = function() {return genTableOfEntityGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfEntityAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfEntityModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarEntitys(info.sim)} ;

    return response.html(Mustache.to_html(getTemplate('entity'), info));
});
