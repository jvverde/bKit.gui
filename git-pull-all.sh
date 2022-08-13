git pull
# https://stackoverflow.com/a/55570998
#git submodule update --init --recursive --merge --remote
#git pull --recurse-submodules

# https://stackoverflow.com/a/49997119
git submodule update --init --recursive
git submodule foreach git checkout master 
git submodule foreach git pull origin master
