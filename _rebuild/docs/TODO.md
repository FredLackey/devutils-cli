- kill-node command: Looks for the Node instances in the current git repo, interogates the acutal process to determine where it is running from and the files it is using, and then kills it off if it is associated with this repo

- build out the cli commands for each of the scripts.  For example, src/scripts/backup-source.js needs to be globally available as `backup-source` once the page is installed globally.

- build out commands to add new installs

- create a prep.sh script to install essentials in whichever enviornment for NVM and node so we can run the doteven installer

Installers
- nordvpn

  1. Research and document installation procedures:                                            
  /build-installer                                                                             
  1. This will create:                                                                         
    - src/installs/google-antigravity.md (documentation)                                       
    - src/installs/google-antigravity.js (installer script)                                    
  2. Analyze dependencies (optional but recommended):                                          
  /identify-installer-dependencies                                                             
  2. This ensures all dependencies are documented.                                             
  3. Add verification functions:                                                               
  /add-isinstalled-functions                                                                   
  3. This adds isInstalled() functions to verify installation.                                 
  4. Test the installer:                                                                       
  /test-installers                                                                             
  4. This tests the installer in Docker containers.                                            
                                                       