FROM golang:1.25-alpine AS builder

ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG GIT_TREE_STATE=unknown
ARG BUILD_DATE=unknown

WORKDIR /workspace

COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download

COPY cmd/ cmd/
COPY pkg/ pkg/
COPY internal/ internal/
COPY hack/ hack/

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-X 'go.miloapis.com/support/internal/version.Version=${VERSION}' \
              -X 'go.miloapis.com/support/internal/version.GitCommit=${GIT_COMMIT}' \
              -X 'go.miloapis.com/support/internal/version.GitTreeState=${GIT_TREE_STATE}' \
              -X 'go.miloapis.com/support/internal/version.BuildDate=${BUILD_DATE}'" \
    -a -o support ./cmd/support

FROM gcr.io/distroless/static:nonroot

WORKDIR /
COPY --from=builder /workspace/support .
USER 65532:65532

ENTRYPOINT ["/support"]
