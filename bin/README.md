owl.js scripts

Be sure to add this directory to your $PATH

## Scripts

 * [owljs-repl](owljs-repl.js) - start a Read-Eval-Print Loop
 * [owljs-grep](owljs-grep.js) - filter axioms from an ontology
 * [owljs-cgrep](owljs-cgrep.js) - filter classes from an ontology
 * [owljs-dlquery](owljs-dlquery.js) - perform a DL query using a reasoner
 * [owljs-match](owljs-match.js) - query axioms for those matching a template pattern
 * [owljs-diff](owljs-diff.js) - performs diff on two OWL files

## Script architecture

Currently each script comes in pairs - the actual implementation
(owljs-foo.js) and a shell wrapper (owljs-foo). You should run the
shell wrapper.

The shell wrapper actually calls a generic wrapper, ringo-owl, also,
in this directory, which takes care of mundanities such as setting
your classpath.

Note the owljs-foo.js file must be both executable and in the PATH for
this to work.

Note that you can run ringo-owl at any time to get a REPL.