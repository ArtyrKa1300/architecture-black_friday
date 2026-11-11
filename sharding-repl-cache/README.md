# sharding-repl-cache

Два шарда по три узла: один PRIMARY и два SECONDARY. Коллекция `somedb.helloDoc` содержит 2000 документов; ключ шардирования — `name` (hashed).

## Запуск и проверка

Из этой папки:

```bash
docker compose up -d
docker compose logs -f mongo-init
```

Дождитесь `Initialization finished`. В логах — количество документов на каждом шарде. Для `mongo-init` ожидается `Exited (0)`.

Приложение: http://localhost:8080. Swagger: http://localhost:8080/docs, коллекция — `helloDoc`.

```bash
curl http://localhost:8080/helloDoc/count
docker compose exec mongos mongosh --quiet --eval "sh.status()"
```

Ожидается 2000 документов, распределённых между двумя шардами.

## Проверка реплик

```bash
docker compose exec shard1-1 mongosh --port 27018 --quiet --eval "rs.status().members.map(m => ({name:m.name,state:m.stateStr}))"
docker compose exec shard2-1 mongosh --port 27018 --quiet --eval "rs.status().members.map(m => ({name:m.name,state:m.stateStr}))"
```

В каждой группе — один `PRIMARY` и два `SECONDARY`.

## Проверка кеша

Дважды подряд выполните (Bash):

```bash
curl -s -o /dev/null -w 'time=%{time_total}s\n' http://localhost:8080/helloDoc/users
```

Первый запрос заполняет кеш, повторный в течение 60 секунд должен занимать меньше 0.1 секунды. На главной странице — `cache_enabled: true`.

Остановка: `docker compose down`.
