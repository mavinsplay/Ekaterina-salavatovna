FROM python:3.12.4-slim

RUN apt update

COPY ./requirements /requirements
RUN pip install -r requirements/prod.txt
RUN rm -rf requirements

COPY ./profor /profor/
WORKDIR /profor

CMD python manage.py makemigrations \
 && python manage.py migrate \
 && python manage.py collectstatic --no-input \
 && gunicorn profor.wsgi:application \
    --timeout 7200 \
    --keep-alive 300 \
    --workers 4 \
    --threads 4 \
    --bind 0.0.0.0:8000 \
    --log-level debug \
    --access-logfile /profor/logs/gunicorn_access.log \
    --error-logfile /profor/logs/gunicorn_error.log
