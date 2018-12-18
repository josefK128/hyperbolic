// mediator.ts 

// socket.io-client
//import * as io from '../../../socket.io-client/dist/socket.io.js';
//import * as io from 'socket.io-client';


// config
//import {config} from  '../configs/@config';

// services - singleton
//import {queue} from './queue';



// singleton instance - exported
var mediator:Mediator;



export class Mediator {
  socket:any;

  constructor(){
    mediator = this;
    if(config.server_connect){
      //this.connect();
    }else{
      console.log(`*** mediator: running without server`);
    }
  }


  // connect to index.js server = config.server_host 
  // on port config.channels_port (default is 8081)
  // set up channels with names specified in config.channels
  connect(){
    var host = config.server_host,
        port = config.server_port;
    console.log(`*** mediator: ${config['_state']} connecting to server ${host}:${port}`);
    this.socket = io.connect("http://" + host + ":" + port);
    for(let channel of config.channels){
      this.log(`Mediator created channel with name = ${channel}`);
      this.socket.on(channel, (o) => {
        queue.push(o);
      });
    }
  }

  // broadcast usable by external services
  emit(channel, msg){
    // guard
    if(config.channels.indexOf(channel) !== -1){
      this.socket.emit(channel, msg);
    }else{
      return false;
    }
  }

  // quick method for emit('actions', action)
  // record to server - used to record application actions to actions-files
  record(action:Object){
    this.socket.emit('actions', action);
  }

  // quick method for emit('log', s)
  // record to server - used to record application log strings to log-files
  log(s:string){
    if(config.log){
      s = s.replace(/(\r\n|\n|\r)/gm,"");  // remove line breaks
      s = `[${(new Date().toJSON()).replace(/^.*T/, '').replace(/Z/, '')}]:${s}`;
      this.socket.emit('log', s);
    }
  }

  // quick method for emit('log', s) AND console.log
  // record to server - used to record application log strings to log-files
  logc(s:string){
    console.log(s);

    // for temp locating ts lineno of m.logc call and stacktrace
    //console.log(`\n${s}`); 
    //console.trace('from mediator.logc');
    if(config.log){
      s = s.replace(/(\r\n|\n|\r)/gm,"");  // remove line breaks
      s = `[${(new Date().toJSON()).replace(/^.*T/, '').replace(/Z/, '')}]:${s}`;
      this.socket.emit('log', s);
    }
  }

  // quick method for emit('log', s) AND console.error
  // record to server - used to record application log strings to log-files
  loge(s:string){
    console.error(s);
    if(config.log){
      s = s.replace(/(\r\n|\n|\r)/gm,"");  // remove line breaks
      s = `!!![${(new Date().toJSON()).replace(/^.*T/, '').replace(/Z/, '')}]:${console.error(s)}`;
      this.socket.emit('log', s);
    }
  }

}//class Mediator


// enforce singleton export
if(mediator === undefined){
  mediator = new Mediator();
}
export {mediator};

