
# Install RingoJS

http://ringojs.org/



Add ringo and owl.js to your PATH. E.g. assume you checked out this
repo into a ~/repos directory:

    export PATH=$PATH:$HOME/ringojs/bin
    export PATH=$PATH:$HOME/repos/owljs/bin

I'm currently working on installation via rp, the ringo package
manager. For now, do this hacky measure:

    cd $RINGO_HOME/packages/
    ln -s ~/repos/owljs owl


