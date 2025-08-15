#
#	Makefile for the Video
#
NAME			:= weather
OS				:= $(shell uname | sed 's/CYGWIN.*/windows/;s/Darwin/macosx/' | tr '[A-Z]' '[a-z]')
LIB				:= ioto/build/bin/libioto.a -L/opt/homebrew/lib -lssl -lcrypto
CFLAGS 			:= -Iioto/include $(LIB)
OPTIMIZE		?= debug
CFLAGS-debug    ?= -g -DME_DEBUG=1
CFLAGS-release  ?= -O2
CFLAGS          += $(CFLAGS-$(OPTIMIZE))

ifeq ($(OS),macosx)
PATH 			:= $(PATH):/opt/homebrew/bin
export 			PATH
endif

ifndef SHOW
.SILENT:
endif

.PHONY: config library prep

all: build

build: library prep config $(NAME) assets.zip

library:
	@make APP=blank OPTIMIZE=$(OPTIMIZE) -C ioto 

prep:
	@if [ ! -d state ] ; then \
		cp -r ioto/state ./state ; \
		rm -f state/config/web.json5 ; \
		mkdir -p state/db ; \
		ioto/bin/json name=Weather state/config/device.json5 ; \
		ioto/bin/json description="Weather App" state/config/device.json5 ; \
		ioto/bin/json model="Weather-01" state/config/device.json5 ; \
		ioto/bin/json app=$(NAME) state/config/ioto.json5 ; \
	fi

$(NAME): $(NAME).c ioto/build/bin/libioto.a
	cc -o $(NAME) $(NAME).c $(CFLAGS)

config:
	@cp config/ioto.json5 state/config/ioto.json5
	@if [ -f config/local.json5 ] ; then \
		cp config/local.json5 state/config/local.json5 ; \
	fi

run:
	./$(NAME)

clean:
	@make -C ioto clean
	@rm -rf $(NAME) ioto-src.tgz weather.dSYM

update:
	rm -fr ioto
	tar xvfz ioto-*.tgz
	mv ioto-?.?.? ioto
	make -C ioto clean

assets.zip: theme/*
	rm -f assets.zip
	zip -R assets.zip theme/*

format:
	uncrustify -q -c .uncrustify --replace --no-backup  *.c 

dump:
	db --schema state/config/schema.json5 state/db/device.db

LOCAL_MAKEFILE := $(strip $(wildcard ./.local.mk))

ifneq ($(LOCAL_MAKEFILE),)
include $(LOCAL_MAKEFILE)
endif
