package version

import (
	"fmt"
	"runtime"
)

var (
	Version      = "v0.0.0-dev"
	GitCommit    = "unknown"
	GitTreeState = "unknown"
	BuildDate    = "unknown"
)

type Info struct {
	Version      string
	GitCommit    string
	GitTreeState string
	BuildDate    string
	GoVersion    string
	Compiler     string
	Platform     string
}

func Get() Info {
	return Info{
		Version:      Version,
		GitCommit:    GitCommit,
		GitTreeState: GitTreeState,
		BuildDate:    BuildDate,
		GoVersion:    runtime.Version(),
		Compiler:     runtime.Compiler,
		Platform:     fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
	}
}
