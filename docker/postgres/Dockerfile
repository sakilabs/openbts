FROM postgres:18.2-trixie

RUN apt update && \
    apt install -y postgis postgresql-18-postgis-3 && \
    rm -rf /var/lib/apt/lists/*

COPY docker/postgres/postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
