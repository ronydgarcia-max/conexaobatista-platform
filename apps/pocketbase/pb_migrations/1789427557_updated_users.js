/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\"\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "updateRule": "id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario' || @request.auth.papel = 'presidente' || @request.auth.papel = 'admin') && igreja_id = @request.auth.igreja_id)\n"
  }, collection)

  return app.save(collection)
})
