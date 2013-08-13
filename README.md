# What is it?

A toolkit for working with OWL ontologies in javascript that leverages
the java OWLAPI.

# Requirements

owl.js is designed to work with RingoJS, a CommonJS-based
JavaScript runtime written in Java and based on the Mozilla Rhino
JavaScript engine.

owl.js makes JVM calls to the OWLAPI, so it would be difficult to port
this to a non-JVM js engine such as Node. The system is designed to be
one component in an ecosystem, and will soon include a RESTful server
using JSON-LD, allowing any kinds of client access to OWL
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

# What can you do with it?

Currenly the main use for this is REPL-based OWL hacking. If you don't
know what this is, then it's probably not for you, at least yet.

To get a sense see the examples in the predecessory, owlrhino:

 * http://code.google.com/p/owltools/wiki/OWLRhino

# Examples

See the (currently rather slim) test files directory.

# Documentation

Inline docs are written using naturaldocs syntax. This is easily
translatable to HTML, but you currently have to do this yourself.

