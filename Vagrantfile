# -*- mode: ruby -*-
# vi: set ft=ruby :

INSTALL_PATH='/usr/local/bin/docker-compose'

COMPOSE_VERSION='1.18.0'

Vagrant.configure("2") do |config|
  config.vm.box = "debian/contrib-stretch64"
  config.vm.synced_folder "..", "/oc", type: "virtualbox"
  config.vm.network "forwarded_port", guest: 13000, host: 23000
  config.vm.network "forwarded_port", guest: 13060, host: 23060

  config.vm.provision "docker" do |d|
    d.pull_images "postgres:9.6"
  end

  config.vm.provision "shell", inline: <<-SHELL

  # Install docker compose
  [ -f #{INSTALL_PATH} ] || {
    sudo apt -yq install curl htop ;
    curl -L https://github.com/docker/compose/releases/download/#{COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > #{INSTALL_PATH} ;
    chmod +x #{INSTALL_PATH}
  }

  # Build and run the app
  docker-compose -f /oc/opencollective-api/docker/docker-compose.yml up --build -d;

  SHELL
end
