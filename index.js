var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var program = require('commander');

app.set('view engine', 'pug');

app.use(express.static('static'));

app.get('/', function (req, res) {
//	res.sendFile(__dirname + "/html/index.html");
    res.render('index');
});

anon_player_id = 0;

id_to_sock = {};

player_names = {};

program.
    version('0.1').
    option('--clientid <id>', 'client id');

program.
    command('say [msg...]').
    option('-t, --to <player>', 'only to player').
    action(function (msg) {
        var sock;
        if (program.to) {
            var otherid = get_player_id(program.to);
            if (otherid) {
                sock = id_to_sock[get_player_id(program.to)];
                sock.emit('console print', (get_player_name(program.clientid) || '<guest>') + ' [private]: ' + msg.join(' '));
            } else {
                id_to_sock[program.clientid].emit('console error', 'no such player');
            }
        } else {
            id_to_sock[program.clientid].emit('console print', '<you>: ' + msg.join(' '));
            id_to_sock[program.clientid].broadcast.emit('console print', (get_player_name(program.clientid) || '<guest>') + ': ' + msg.join(' '));
        }
//        var sock = id_to_sock[program.client];
//        sock.emit('console print', msg.join(' '));
    });

program.
    command('nick [name]').
    action(function (name) {
        if (name) {
            if (name == "" || name[0] == '<') {
                id_to_sock[program.clientid].emit('console error', 'invalid nick');
            } else {
                player_names[program.clientid] = name;
            }
        } else if (get_player_name(program.clientid)) {
            id_to_sock[program.clientid].emit('console print', get_player_name(program.clientid));
        } else {
            id_to_sock[program.clientid].emit('console print', '<guest>');
        }
    });

function get_player_name(id) {
    if (id in player_names) {
        return player_names[id];
    } else {
        return false;
    }
}

function get_player_id(name) {
    for (id in player_names) {
        if (player_names[id] === name)
            return id;
    }
    return false;
}

function docmd(cmd, client_id) {
    //console.log(id_to_sock[client_id]);
    var args = ['', '', '--clientid', client_id].concat(cmd.replace('--clientid', '').match(/(".*?")|(\S+)/g));
    console.log(args);
    program.parse(args);
//    program.parse('--client ' + client_id + ' ' + cmd);
}

io.on('connection', function (sock) {
	console.log('new connection');

//    socket_player[sock] = '<' + anon_player_id + '>';
//    player_socket['<' + anon_player_id + '>'] = sock;
    //
    id_to_sock[sock.id] = sock;

	sock.on('disconnect', function () {
		console.log('ended connection');
//		io.emit('c leave', {});
	});

    sock.on('console enter', function (msg) {
        docmd(msg, sock.id);
        //sock.emit('console print', msg);
    });

    /*
	sock.on('c nick', function (name) {
		console.log('requesting nick ' + name);
		sock.broadcast.emit('c nick', name);
	});

	sock.on('c nick nack', function (name) {
		console.log('objection to nick ' + name);
		sock.broadcast.emit('c nick nack', name);
	});

	sock.on('c whois', function (name) {
		sock.broadcast.emit('c whois', name);
	});

	sock.on('c test', function (msg) {
		console.log("test: " + msg);
		sock.emit('c test', msg);
	});

	sock.on('s playerPos', function (obj) {
		sock.broadcast.emit('s playerPos', obj);
	});
    */
});

http.listen(3000, function () {
	console.log('listening on *:3000');
});
