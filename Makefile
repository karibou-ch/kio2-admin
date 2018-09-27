


prod:
#	cp app/assets/robots.txt.prod build/robots.txt
	NODE_ENV=prod ionic cordova build browser --prod
	rsync -avziu --delete-after -e 'ssh -p22' platforms/browser/www/ evaleto@evaletolab.ch:www/admin.karibou.ch/

devel:
#	cp app/assets/robots.txt.devel build/robots.txt
        NODE_ENV=devel ionic cordova build browser --prod
        rsync -avziu --delete-after -e 'ssh -p22' platforms/browser/www/ evaleto@evaletolab.ch:www/admin.karibou.ch/

panierlocal:
        NODE_ENV=panierlocal ionic cordova build browser --prod
        rsync -avziu --delete-after -e 'ssh -p22' platforms/browser/www/ evaleto@evaletolab.ch:www/pladmin.karibou.ch/

bretzel:
        NODE_ENV=bretzel ionic cordova build browser --prod
#	cp app/assets/robots.txt.devel build/robots.txt
        rsync -avziu --delete-after -e 'ssh -p22' platforms/browser/www/ evaleto@evaletolab.ch:www/admin.boulangerie-bretzel.ch/



.PHONY: docs clean 
