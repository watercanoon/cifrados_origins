public class AlbertiSolver2 {
    public static void main(String[] args) {
        String outer = "ABCDEFGILMNOPQRSTVXZ1234";
        String pt = "SIFVERAPRECISODECIRSIDILOCONVALOR"; // U replaced by V
        String ct = "zclxcxhztmkpetgpfu&vlhsyskitiafaik";

        for (int direction = -23; direction < 24; direction++) {
            if (direction == 0) continue;
            for (int shiftAmount = -23; shiftAmount < 24; shiftAmount++) {
                if (shiftAmount == 0) continue;

                char[] inner = new char[24];
                boolean consistent = true;

                for (int i = 0; i < pt.length(); i++) {
                    char p = pt.charAt(i);
                    char c = ct.charAt(i);
                    int outerIdx = outer.indexOf(p);
                    if (outerIdx == -1) {
                        consistent = false;
                        break;
                    }

                    int block = i / 4;
                    // assume idxB = 0
                    int innerIdx = (0 + block * shiftAmount + direction * (outerIdx - 9) + 24 * 1000) % 24;

                    if (inner[innerIdx] != 0 && inner[innerIdx] != c) {
                        consistent = false;
                        break;
                    }
                    inner[innerIdx] = c;
                }

                if (consistent) {
                    boolean[] seen = new boolean[256];
                    int count = 0;
                    for (char c : inner) {
                        if (c != 0) {
                            if (seen[c]) {
                                consistent = false;
                                break;
                            }
                            seen[c] = true;
                            count++;
                        }
                    }

                    if (consistent) {
                        System.out.println("=== SOLUTION FOUND ===");
                        System.out.println("Direction/Step: " + direction);
                        System.out.println("Shift Amount: " + shiftAmount);
                        System.out.print("Reconstructed Inner: ");
                        for (char c : inner) {
                            System.out.print(c == 0 ? '.' : c);
                        }
                        System.out.println();
                    }
                }
            }
        }
    }
}
