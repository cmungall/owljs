# What is it?

A toolkit for working with OWL ontologies in javascript that leverages
the java OWLAPI.

# Quickstart

See [the API documentation](http://htmlpreview.github.io/?https://github.com/cmungall/owl.js/blob/master/docs/files/owl-js.html)

Or try some scripts:

Remove annotation assertions from an ontology:

    owljs-grep 'function(ax){ return ax.isLogicalAxiom() }' foo.owl > fooLogical.owl

Run a DL query:

    owljs-dlquery -r elk "'part_of' some 'cell'" foo.owl

Start a REPL:

    owljs-repl -i bootcl.js cl-edit.owl
    >> x = someValuesFrom(o.part_of, o.cell)
    >> cell_parts = owl.getInferredSubClasses(x)
    >> cell_parts.map(pp)

# Requirements

owl.js requires [RingoJS](http://ringojs.org/), a CommonJS-based JavaScript runtime written
in Java and based on the Mozilla Rhino JavaScript engine.

owl.js also requires an OWLAPI jar. This repository has the owltools
jar bundled (which includes the owlapi as part).

# Installation

Download and install ringojs
http://ringojs.org/

Add ringo and owl.js to your PATH. E.g. assume you checked out this
repo into a ~/repos directory:

    export PATH=$PATH:$HOME/ringojs/bin
    export PATH=$PATH:$HOME/repos/owl.js/bin


# Getting started

You can use the pre-packaged scripts without any knowledge of the
API. For more interactive hacking, you can use the REPL. Custom
scripts can be built using the the [owl.js API](http://htmlpreview.github.io/?https://github.com/cmungall/owl.js/blob/master/docs/files/owl-js.html)

## Running Scripts

All scripts are in the [bin](bin/) directory.

See the [bin/README](bin/README.md) for more details

## OWL Hacking

Hacking can be either interactive (in the REPL) or can involve writing
your own scripts.

Either requires some knowledge of [the owl.js
API](http://htmlpreview.github.io/?https://github.com/cmungall/owl.js/blob/master/docs/files/owl-js.html),
and many some cases, knowledge of the java OWLAPI.

## REPL hacking

Currenly the main use for this module is REPL-based OWL hacking. If
you don't know what this is, then it's probably not for you, at least
not yet.

To start a REPL session:

    owljs-repl [OWLFILE]

You can type any javascript commands, e.g.

    print(1+2)

Assuming your ontology has the relevant classes, you can add an axiom:

    add(subClassOf(o.epithelium, o.portion_of_tissue))

(note that autocomplete is enabled)

See [repl.md](repl.md) for more examples

### Writing scripts

See the bin/ directory for examples of scripts.

### Unit tests and examples

TODO

# Stability and future directions

## Combined use with BBOP and Monarch APIs

owl.js is currently neutral w.r.t. domain - biology, pizzas, ...

It can be combined with complementary domain-specific APIs (either js
APIs, java APIs, or REST APIs). In particular, I anticipate adding
scripts that leverage two other js APIs: bbop-js and
monarch-api. bbop-js runs under any js engine, and monarch-api is
developed in ringo.

TODO

## Running under node.js

owl.js makes JVM calls to the OWLAPI, so it would be difficult to port
this to a non-JVM js engine such as Node. The system is designed to be
one component in an ecosystem, and may one day include a RESTful
server using JSON-LD, allowing any kinds of client access to OWL
capabilities. The same API may be preserved, allowing a node.js client
to make RESTful calls to a jvm owl.js server as if it were talking to
the JVM.

# Why JavaScript?

The java OWLAPI is the library of choice for serious heavyweight
ontology lifting. However, java can be unwiedly and doesn't lend
itself well to small ad-hoc tasks, command line scripting or shell
programming.

There are a number of excellent efforts that leverage the OWLAPI from
other JVM libraries including:

 * Groovy
 * Scala (https://github.com/balhoff/strix)
 * Clojure (Tawny-OWL)
 * Armed Bear Common Lisp (LSW)

In addition, there are non-JVM libs that implement some or many of the
features of the OWLAPI (OntoPerl, Thea/prolog).

I created a JS library because JS is already widely used in our group
(both on the client and the server), and easy integration with
libraries such as bbop.js are a big win.

It's not a perfect solution. Ringo has less of an ecosystem than
node. And the Rhino engine (which Ringo is built on) has IMHO quite an
awkward bridge between js and java, particularly when it comes to
working with arrays or sets (owl.js has some convenience methods for
wrapping these two). This may be less of an issue in future if we move
towards some kind of standard REST access to the OWLAPI.

On balance, after having experimented with other options, the js+java
combination works well for our group. YMMV.



