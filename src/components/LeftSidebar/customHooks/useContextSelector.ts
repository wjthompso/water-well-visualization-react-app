import { useContext, useEffect, useState } from "react";

import { Context as ReactContext } from "react";

export function useContextSelector<T, S>(
    Context: ReactContext<T>,
    selector: (value: T) => S
) {
    const contextValue = useContext(Context);
    const selectedValue = selector(contextValue);

    // Keep track of the selected value in the state
    const [state, setState] = useState(selectedValue);

    useEffect(() => {
        // Update the state only if the selected value changes
        const newSelectedValue = selector(contextValue);
        if (newSelectedValue !== state) {
            setState(newSelectedValue);
        }
    }, [contextValue, state, selector]);

    return state;
}
