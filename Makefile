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

build: config library $(NAME) assets.zip

config:
	@echo "      [Info] Configuring $(NAME)"
	mkdir -p state/config state/db state/certs
	for f in device.json5 ioto.json5 schema.json5 local.json5 ; do \
		if [ ! -f "state/config/$$f" -a -f "config/$$f" ] ; then \
			cp config/$$f state/config ; \
		fi ; \
	done
	if [ state/config/ioto.json5 -nt ioto/state/config/ioto.json5 ] ; then \
		mkdir -p ioto/state/config ; \
		cp state/config/ioto.json5 ioto/state/config ; \
	fi
	cd ioto >/dev/null ; bin/prep-build
	ioto/bin/json --overwrite name=Weather state/config/device.json5
	ioto/bin/json --overwrite description="Weather App" state/config/device.json5
	ioto/bin/json --overwrite model="Weather-01" state/config/device.json5
	ioto/bin/json --overwrite app=$(NAME) state/config/ioto.json5

library:
	@make APP=blank OPTIMIZE=$(OPTIMIZE) -C ioto 
	cp -r ioto/state/certs/* state/certs

$(NAME): $(NAME).c ioto/build/bin/libioto.a
	cc -o $(NAME) $(NAME).c $(CFLAGS)
	echo "     [Built] $(NAME)"

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
