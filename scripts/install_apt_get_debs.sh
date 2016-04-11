#!/bin/bash
# cfr. https://discuss.circleci.com/t/add-ability-to-cache-apt-get-programs/598/6

set -e

APT_PACKAGES=(google-chrome-stable)
APT_CACHE=~/cache/apt

# Work from the directory CI will cache
mkdir -p ${APT_CACHE}
cd ${APT_CACHE}

# check we have a deb for each package
useCache=true
for pkg in "${APT_PACKAGES[@]}"; do
  if ! ls | grep "^${pkg}"; then
    useCache=false
  fi
done

set -x

if [ ${useCache} == true ]; then
  sudo dpkg -i *.deb
  exit 0
fi

wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install --reinstall "${APT_PACKAGES[@]}"

cp -v /var/cache/apt/archives/*.deb ${APT_CACHE}