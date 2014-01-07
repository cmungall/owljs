# What is it?

A toolkit for working with OWL ontologies in javascript that leverages
the java OWLAPI.

# Requirements

owl.js requires RingoJS, a CommonJS-based JavaScript runtime written
in Java and based on the Mozilla Rhino JavaScript engine.

owl.js also requires an OWLAPI jar. This repo has the owltools jar
bundled (which includes the owlapi as part).

# Installation

Download and install ringojs
http://ringojs.org/

Add ringo and owl.js to your PATH. E.g. assume you checked out this
repo into a ~/repos directory:

    export PATH=$PATH:$HOME/ringojs/bin
    export PATH=$PATH:$HOME/repos/owl.js/bin

# API Documentation

 * (http://htmlpreview.github.io/?https://github.com/cmungall/owl.js/blob/master/docs/files/owl-js.html)[owl.js]


# Getting started

## Scripts

All scripts are in the (bin/README.md)[bin] directory.

## REPL

See below

## Coding to the API

The core module is owl.js

## Execution

For convenience, you should use 'ringo-owl' in the bin/ directory -
this acts the same way as the normal ringo command, but also takes
care of including the correct owlapi jars in your path.

## Basics

Include this at the top of your code:

    var {OWL} = require("../lib/owl");

This is shorthand for the standard CommonJS idiomatic:

    var OWL = require("../lib/owl").OWL;

## Loading an ontology

    var owl = new OWL();
    owl.loadOntology("my-ontology.owl");

## Doing stuff

   var owlClass = owl.find("epithelium");

## REPL hacking

Currenly the main use for this module is REPL-based OWL hacking. If
you don't know what this is, then it's probably not for you, at least
not yet.

To get a sense see the examples in the predecessor, owlrhino:

 * http://code.google.com/p/owltools/wiki/OWLRhino

## More Examples

See the (currently rather slim) test files directory.


# Future

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
