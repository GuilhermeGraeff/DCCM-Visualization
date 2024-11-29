import sys
import random
import MDAnalysis as mda

class dataTranformer:
    def __init__(self):
        # print('Program starting up.')
        self.misc = Mycelium(self)
        self.algs = Algorithms(self)
        # print('Program is running.')


class Mycelium:

    def __init__(self, parent):
        self.utils = parent
        # print('Mycelium is up and running.')

    def templateFunction(self, param_one, param_two):
        do_stuff_here = param_one + param_two
        return do_stuff_here


class Algorithms:

    def __init__(self, parent):
        self.utils = parent
        # print('Algorithms is up and running.')

    def templateFunction(self, vector):
        print("---")
        return vector


def main() -> int:
    app = dataTranformer()

    print()
    return 0


if __name__ == '__main__':
    sys.exit(main()) 