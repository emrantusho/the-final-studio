DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS app_settings; DROP TABLE IF EXISTS chats; DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS documents; DROP TABLE IF EXISTS secure_keys;
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TIMESTAMP NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE secure_keys (provider_id TEXT PRIMARY KEY, encrypted_key_hex TEXT NOT NULL, iv_hex TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users (username, password_hash) VALUES ('admin', 'admin');
INSERT INTO app_settings (key, value) VALUES ('auto_dev_mode', 'false'); INSERT INTO app_settings (key, value) VALUES ('github_repo_url', '');
