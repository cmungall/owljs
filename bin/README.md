owl.js scripts

Be sure to add this directory to your $PATH

## Script architecture

Currently each script comes in pairs - the actual implementation
(owljs-foo.js) and a shell wrapper (owljs-foo). You should run the
shell wrapper.

The shell wrapper actually calls a generic wrapper, ringo-owl, also,
in this directory, which takes care of mundanities such as setting
your classpath.

Note that you can run ringo-owl at any time to get a REPL.