exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Para referência, Github limita o username a 39 chars
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },

    // A referência para o tamanho de email vem de uma resposta do Stack Overflow: https://stackoverflow.com/a/1199238
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    // A referência para o tamanho da senha vem de: https://www.npmjs.com/package/bcrypt#hash-info
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    // Referência para uso de timezone: https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },

    updated_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  });
};

exports.down = false;
