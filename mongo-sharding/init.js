// Учебный стенд: replica sets -> mongos -> hashed collection -> тестовые данные.
const sets = [{"name": "configRs", "hosts": ["configSrv:27019"], "config": true}, {"name": "shard1Rs", "hosts": ["shard1-1:27018"], "config": false}, {"name": "shard2Rs", "hosts": ["shard2-1:27018"], "config": false}];
function waitFor(check, message, timeout, interval) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (check()) return;
    sleep(interval);
  }
  throw new Error(message);
}
function worked(result) {
  if (result.ok !== 1) throw new Error(JSON.stringify(result));
}
function connect(uri) {
  let connection;
  waitFor(() => {
    try { connection = new Mongo(uri); return connection.getDB('admin').runCommand({ping:1}).ok === 1; }
    catch (e) { return false; }
  }, 'MongoDB connection timeout: '+uri, 180000, 1000);
  return connection;
}
for (const set of sets) {
  const node = connect('mongodb://'+set.hosts[0]+'/?directConnection=true&serverSelectionTimeoutMS=2000');
  const admin = node.getDB('admin');
  let status;
  try { status = admin.runCommand({replSetGetStatus:1}); }
  catch (e) { if (e.code !== 94) throw e; status = {ok:0,code:94}; }
  if (!status.ok) {
    if (status.code !== 94) throw new Error(JSON.stringify(status));
    const config = {_id:set.name, members:set.hosts.map((host,i)=>({_id:i,host}))};
    if (set.config) config.configsvr = true;
    worked(admin.runCommand({replSetInitiate:config}));
  }
  waitFor(() => {
    try {
      const result = admin.runCommand({replSetGetStatus:1});
      return result.ok && result.members.length === set.hosts.length &&
        result.members.every(m=>m.health===1 && [1,2].includes(m.state));
    } catch(e) { return false; }
  }, 'Replica set not ready: '+set.name, 180000, 1000);
  print(set.name+': '+set.hosts.length+' data-bearing node(s) ready');
}
const router = connect('mongodb://mongos:27017/?serverSelectionTimeoutMS=2000');
const admin = router.getDB('admin');
for (const set of sets.filter(s=>!s.config)) {
  worked(admin.runCommand({addShard:set.name+'/'+set.hosts.join(',')}));
}
worked(admin.runCommand({enableSharding:'somedb'}));
const metadata = router.getDB('config').collections.findOne({_id:'somedb.helloDoc',dropped:{$ne:true}});
if (!metadata) {
  worked(admin.runCommand({shardCollection:'somedb.helloDoc',key:{name:'hashed'},numInitialChunks:4}));
}
const collection = router.getDB('somedb').helloDoc;
// Upsert делает повторный запуск безопасным: записи не дублируются.
const operations = Array.from({length:2000},(_,i)=>({updateOne:{filter:{name:'ly'+i},update:{$set:{name:'ly'+i,age:i%100}},upsert:true}}));
collection.bulkWrite(operations,{ordered:false});
const total = collection.countDocuments({});
if (total < 2000) throw new Error('Expected at least 2000 documents');
print('somedb.helloDoc total: '+total);
for (const set of sets.filter(s=>!s.config)) {
  const shard = connect('mongodb://'+set.hosts.join(',')+'/?replicaSet='+set.name+'&serverSelectionTimeoutMS=2000');
  print(set.name+' documents: '+shard.getDB('somedb').helloDoc.countDocuments({}));
}
print('Initialization finished');
