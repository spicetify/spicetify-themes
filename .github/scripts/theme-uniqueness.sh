#!/usr/bin/env bash

# hidden folders are skipped in this
for dir1 in *; do
    # skip files
    if [[ -f "$dir1" ]] || [[ "$dir1" == "_Extra" ]] ; then
        continue
    fi

    for dir2 in *; do
        # skip files
        if [[ -f "$dir2" ]] || [[ "$dir2" == "_Extra" ]]; then
            continue
        fi
        
        # skip comparison between the theme and itself
        if [[ "$dir1" != "$dir2" ]]; then
            css1="$dir1/user.css" 
            css2="$dir2/user.css" 

            if [ ! -e "$css1" -a ! -e "$css2" ]; then 
                echo "Found duplicate themes: $dir1 and $dir2"
                echo "Both have no user.css"
                exit 1
            # check if user.css does not exist in one of the 2 themes
            elif [ ! -e "$css1" -o ! -e "$css2" ]; then 
                continue
            fi

            # compare color css and check if there are no differences apart
            # from whitespace
            diffs=$(diff -b "$css1" "$css2")
            
            if [[ -z "$diffs" ]]; then
                echo "Found duplicate themes: $dir1 and $dir2"
                exit 1
            fi
        fi
    done
done
