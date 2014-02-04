
.PHONY: docs
docs:
	naturaldocs --rebuild-output --input lib --project lib/.naturaldocs_project/ --output html docs/

jars/owltools-runner-all.jar:
	cd jars && wget http://build.berkeleybop.org/job/owltools/lastSuccessfulBuild/artifact/owltools/OWLTools-Runner/bin/$@ -O $@

## http://secret-harbor-1370.herokuapp.com/
heroku-create:
	heroku create --stack cedar --buildpack https://github.com/cmungall/heroku-buildpack-ringojs-jdk7.git --remote monarch-heroku
heroku-deploy:
	git push monarch-heroku master

TEST = ringo-owl

test: 
	$(TEST) tests/alltests.js 
