if test "$NODE_ENV" = "" || test "$NODE_ENV" = "development" ; then echo "Skipping postinstall build because NODE_ENV is '${NODE_ENV}'" ; else npm run build ; fi
