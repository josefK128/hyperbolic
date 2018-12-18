* __hyperbolic README__

* [1] clone the repo: 
  cd to appropriate root directory for 'hyperbolic' - say 'root'
  root>git clone https://github.com/josefK128/hyperbolic
  This copies the repository at root/hyperbolic

* [2] cd to root/hyperbolic
  run 'npm run start' - starts small http server 'live-server'

* [3] run URLs in browser
  [a]
  unit tests: 'localhost:8080/test/'  (index.html)
  NOTE:if running tests best to run in Chrome and open devtools via the
  'three vertical dots' icon - select 'more tools - select 'developer tools'
  and 'console' should come up (what we want), or alternatively select
  'console' (which gives program output) such as test results in the case
  of the unit tests.
  [b]
  application: 'localhost:8080/src/'  (index.html)
  Follow the GUI - checkboxes remove one or both cubes
  Sliders translate the cubes in x,y or z.
  Reset returns both cubes to their intial positions 
  Initial positions are stated in the GUI.


