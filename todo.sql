create database todo;
use todo;
CREATE TABLE tasks (
    id int auto_increment primary key,
    task varchar(255) not null,
    done boolean not null default false
);
show tables;
create table users(
id int auto_increment primary key,
fullName varchar(50) not null,
username varchar(20) not null unique,
pass varchar(50) not null
);


INSERT INTO users (fullName, username, pass) VALUES
('Muzammil Ahmad', 'muzammil', 'pass123'),
('Ali Khan', 'alikhan', 'ali2025'),
('Sara Malik', 'saram', 'sara!pwd'),
('Hassan Raza', 'hassanr', 'hassan#321');
select * from users;
select * from tasks;

INSERT INTO tasks (task, done) VALUES
('Finish MySQL setup', 0),
('Build first API route', 1),
('Test database connection', 0),
('Write documentation', 1);
describe users;
ALTER TABLE users MODIFY pass VARCHAR(255) NOT NULL;
drop table users;
select * from users;
delete from users where id=8;
ALTER TABLE tasks ADD COLUMN userId INT NOT NULL;